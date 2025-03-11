import { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CloudUpload, CheckCircle, X, Loader, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/utils';

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  folioNumber?: string;
  error?: string;
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [folioData, setFolioData] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    
    const newFiles = Array.from(event.target.files).map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      progress: 0,
      status: 'pending' as const
    }));
    
    // Filter out non-PNG files
    const invalidFiles = newFiles.filter(f => f.file.type !== 'image/png');
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file format",
        description: "Only PNG files are allowed",
        variant: "destructive"
      });
      
      // Keep only PNG files
      const pngFiles = newFiles.filter(f => f.file.type === 'image/png');
      setFiles(prev => [...prev, ...pngFiles]);
    } else {
      setFiles(prev => [...prev, ...newFiles]);
    }
    
    // Reset input value so the same file can be selected again
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (event.dataTransfer.files?.length) {
      const newFiles = Array.from(event.dataTransfer.files)
        .filter(file => file.type === 'image/png')
        .map(file => ({
          file,
          id: Math.random().toString(36).substring(2, 9),
          progress: 0,
          status: 'pending' as const
        }));
      
      if (newFiles.length === 0) {
        toast({
          title: "Invalid file format",
          description: "Only PNG files are allowed",
          variant: "destructive"
        });
        return;
      }
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;
    
    setIsUploading(true);
    
    try {
      // Extract folio numbers from filenames or prompt user to select
      const folioDataFinal: Record<string, string> = { ...folioData };
      
      // Prepare files to upload
      for (const file of files) {
        if (file.status === 'complete') continue;
        
        // Try to extract folio number from filename
        // Formats like: "page_001.png", "folio_01r.png", etc.
        const filenameFolioMatch = file.file.name.match(/(?:page|folio)[_-]?(\d+)([rv]?)/i);
        if (filenameFolioMatch) {
          const pageNum = parseInt(filenameFolioMatch[1]);
          const side = filenameFolioMatch[2]?.toLowerCase() || 'r'; // Default to recto
          folioDataFinal[file.file.name] = `${pageNum}${side}`;
        } else if (!folioDataFinal[file.file.name]) {
          // If no folio number is found, use a generic one based on position
          const index = files.indexOf(file);
          folioDataFinal[file.file.name] = `${index + 1}r`;
        }
      }
      
      // Upload files in batches of 5
      const pendingFiles = files.filter(f => f.status !== 'complete');
      const batchSize = 5;
      const batches = Math.ceil(pendingFiles.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batchFiles = pendingFiles.slice(i * batchSize, (i + 1) * batchSize);
        
        // Upload this batch concurrently
        await Promise.all(batchFiles.map(async (file) => {
          try {
            // Update status to uploading
            setFiles(prev => prev.map(f => 
              f.id === file.id ? { ...f, status: 'uploading' } : f
            ));
            
            const formData = new FormData();
            batchFiles.forEach(f => {
              formData.append('pages', f.file);
            });
            formData.append('folioData', JSON.stringify(folioDataFinal));
            
            // Simulated upload progress
            const uploadInterval = setInterval(() => {
              setFiles(prev => prev.map(f => {
                if (f.id === file.id && f.progress < 90) {
                  return { ...f, progress: f.progress + 10 };
                }
                return f;
              }));
            }, 300);
            
            // Send the actual request
            const response = await fetch('/api/admin/upload', {
              method: 'POST',
              body: formData,
              credentials: 'include'
            });
            
            clearInterval(uploadInterval);
            
            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Update file status based on results
            setFiles(prev => prev.map(f => {
              if (batchFiles.some(bf => bf.id === f.id)) {
                const fileResult = result.results.find(
                  (r: any) => r.originalname === f.file.name
                );
                
                if (fileResult?.success) {
                  return { ...f, progress: 100, status: 'complete', folioNumber: fileResult.folioNumber };
                } else {
                  return { 
                    ...f, 
                    progress: 100, 
                    status: 'error',
                    error: fileResult?.error || 'Upload failed' 
                  };
                }
              }
              return f;
            }));
            
          } catch (error) {
            // Update status to error
            setFiles(prev => prev.map(f => 
              f.id === file.id ? { 
                ...f, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              } : f
            ));
          }
        }));
      }
      
      // Check if all files uploaded successfully
      const allSuccess = files.every(f => f.status === 'complete');
      if (allSuccess) {
        toast({
          title: "Upload complete",
          description: `Successfully uploaded ${files.length} manuscript pages`
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorCount = files.filter(f => f.status === 'error').length;
        toast({
          title: "Upload partially complete",
          description: `${errorCount} files failed to upload`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const allComplete = files.length > 0 && files.every(f => f.status === 'complete');

  return (
    <Dialog open={open} onOpenChange={(open) => !isUploading && onOpenChange(open)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">Upload Manuscript Pages</DialogTitle>
        </DialogHeader>
        
        <div className="mb-5">
          <p className="text-sm text-neutral-500">
            Upload high-resolution PNG images of manuscript pages. Files should be named sequentially (e.g., page_001.png).
          </p>
        </div>
        
        <div 
          className="border-2 border-dashed border-neutral-300 rounded-lg p-6 mb-4 cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleBrowseFiles}
        >
          <div className="text-center">
            <CloudUpload className="mx-auto h-12 w-12 text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-500 mb-2">Drag and drop files, or click to browse</p>
            <Button size="sm" disabled={isUploading}>
              Select Files
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".png" 
              multiple 
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-neutral-700 mb-2">
              Upload Queue ({files.length} files)
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {files.map(file => (
                <div key={file.id} className="flex items-center text-sm bg-neutral-100 p-2 rounded">
                  <div className="mr-2">
                    {file.status === 'complete' ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : file.status === 'error' ? (
                      <div className="text-error">
                        <X className="h-4 w-4" />
                      </div>
                    ) : file.status === 'uploading' ? (
                      <Loader className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <div className="h-4 w-4 border border-neutral-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium truncate">{file.file.name}</div>
                    <div className="text-xs text-neutral-500">
                      {formatBytes(file.file.size)} • {
                        file.status === 'complete' ? 'Complete' : 
                        file.status === 'error' ? 'Failed' : 
                        file.status === 'uploading' ? `${file.progress}% uploaded` :
                        'Pending'
                      }
                      {file.folioNumber && ` • Folio: ${file.folioNumber}`}
                    </div>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-1 mt-1" />
                    )}
                    {file.status === 'error' && file.error && (
                      <div className="text-xs text-error">{file.error}</div>
                    )}
                  </div>
                  <button 
                    className="text-neutral-400 hover:text-neutral-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file.id);
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <div className="text-neutral-700 text-sm">
            <Info className="inline-block mr-1 h-4 w-4 text-info" />
            Processing may take several minutes
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={uploadFiles}
              disabled={files.length === 0 || isUploading || allComplete}
            >
              {isUploading ? 'Uploading...' : allComplete ? 'Uploaded' : 'Upload All'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;

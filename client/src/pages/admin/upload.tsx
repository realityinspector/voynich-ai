import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, Image, PlusCircle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import UploadDialog from '@/components/upload/UploadDialog';

export default function UploadPage() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Fetch recent uploads
  const { data: pagesData, isLoading: pagesLoading, refetch: refetchPages } = useQuery({
    queryKey: ['/api/pages?limit=10'],
    retry: false,
  });
  
  const pages = pagesData?.pages || [];
  
  // Handle successful upload
  const handleUploadSuccess = () => {
    refetchPages();
  };
  
  // If user is not admin, redirect or show error
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2 text-destructive">Access Denied</h2>
            <p>You need administrator privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Upload Manuscript Pages</h1>
          <p className="text-neutral-600">
            Upload high-resolution PNG images of the Voynich Manuscript pages.
          </p>
        </div>
        
        <Button 
          onClick={() => setUploadDialogOpen(true)}
          className="flex items-center"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Pages
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
          <CardDescription>Follow these guidelines for optimal results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                  <span className="font-bold text-primary">1</span>
                </div>
                File Requirements
              </h3>
              <ul className="text-sm text-neutral-600 space-y-1 list-disc pl-5">
                <li>PNG format only</li>
                <li>High resolution (minimum 1200x1600 pixels)</li>
                <li>Maximum file size: 20MB per image</li>
                <li>Clean, properly cropped images</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                  <span className="font-bold text-primary">2</span>
                </div>
                Naming Convention
              </h3>
              <ul className="text-sm text-neutral-600 space-y-1 list-disc pl-5">
                <li>Use consistent naming: <code>page_001.png</code></li>
                <li>Or include folio number: <code>folio_1r.png</code></li>
                <li>Add section indicator if known</li>
                <li>Sequential numbering for multi-uploads</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                  <span className="font-bold text-primary">3</span>
                </div>
                After Upload
              </h3>
              <ul className="text-sm text-neutral-600 space-y-1 list-disc pl-5">
                <li>Verify page metadata is correct</li>
                <li>Add section classification</li>
                <li>Run initial symbol extraction</li>
                <li>Add relevant annotations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>Most recently uploaded manuscript pages</CardDescription>
        </CardHeader>
        <CardContent>
          {pagesLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto text-neutral-300 animate-spin" />
              <p className="mt-2 text-neutral-500">Loading recent uploads...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8">
              <Image className="h-8 w-8 mx-auto text-neutral-300" />
              <p className="mt-2 text-neutral-500">No pages uploaded yet</p>
              <Button 
                variant="outline" 
                onClick={() => setUploadDialogOpen(true)}
                className="mt-2"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Upload Your First Page
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map(page => (
                <div key={page.id} className="group relative">
                  <div className="aspect-[3/4] rounded-md overflow-hidden border border-neutral-200">
                    <img 
                      src={`/uploads/${page.filename}`} 
                      alt={`Page ${page.folioNumber}`}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <div className="mt-1">
                    <p className="font-medium text-sm text-neutral-800">{page.folioNumber}</p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {page.section || 'Unclassified'} • 
                      {new Date(page.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Upload Dialog */}
      <UploadDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

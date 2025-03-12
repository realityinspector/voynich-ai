import { useState, useEffect } from 'react';
import { X, Cog, Check, RefreshCw, Shield } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useManuscript } from '@/hooks/useManuscript';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

interface SymbolExtractionProps {
  pageId: number;
  folioNumber?: string;
  onClose: () => void;
  initialMode?: 'single' | 'range' | 'all';
}

const SymbolExtraction: React.FC<SymbolExtractionProps> = ({ 
  pageId, 
  folioNumber,
  onClose,
  initialMode = 'single'
}) => {
  const { toast } = useToast();
  const { useManuscriptPages } = useManuscript();
  const { isAdmin } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1);
  const [symbolsExtracted, setSymbolsExtracted] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [extractionMode, setExtractionMode] = useState<'single' | 'range' | 'all'>(initialMode);
  
  // Fetch all pages for range selection
  const { data: pagesData, isLoading: pagesLoading } = useManuscriptPages();
  const pages = pagesData?.pages || [];
  
  // Extraction parameters
  const [config, setConfig] = useState({
    preset: 'default',
    threshold: 128,
    minSize: 16,
    maxSize: 64,
    ignoreMargins: true,
    enhancementPreset: 'none',
    advanced: {
      contourApproximation: 'simple',
      edgeDetection: 'canny',
      noiseReduction: 'median',
    }
  });
  
  // Range selection
  const [range, setRange] = useState({
    startPageId: pageId,
    endPageId: pageId
  });
  
  // Set the appropriate range when in "all pages" mode
  useEffect(() => {
    if (extractionMode === 'all' && pages.length > 0) {
      const firstPageId = pages[0].id;
      const lastPageId = pages[pages.length - 1].id;
      setRange({
        startPageId: firstPageId,
        endPageId: lastPageId
      });
    }
  }, [extractionMode, pages]);

  // Mutation for starting an extraction job
  const startExtractionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/extraction/start', data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      simulateExtractionProcess(data.job.id);
      toast({
        title: "Extraction job started",
        description: "The system is now processing your request"
      });
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Failed to start extraction",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const handleStartExtraction = () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setProgress(0);
    setStep(1);
    
    const parameters = {
      ...config,
      advanced: showAdvanced ? config.advanced : undefined
    };
    
    startExtractionMutation.mutate({
      startPageId: range.startPageId,
      endPageId: range.endPageId,
      parameters
    });
  };

  // Simulate the extraction process (in a real app, we would poll the server for progress)
  const simulateExtractionProcess = (jobId: number) => {
    const steps = ['Preprocessing', 'Character Detection', 'Feature Extraction', 'Symbol Classification'];
    let currentStep = 0;
    let currentProgress = 0;
    
    const interval = setInterval(() => {
      currentProgress += 5;
      
      if (currentProgress >= 100) {
        currentProgress = 0;
        currentStep++;
        
        if (currentStep >= steps.length) {
          clearInterval(interval);
          handleExtractionComplete();
          return;
        }
        
        setStep(currentStep + 1);
      }
      
      setProgress(currentProgress);
    }, 500);
    
    // Simulate extracting random number of symbols between 150 and 250
    const extractedCount = Math.floor(Math.random() * 100) + 150;
    setSymbolsExtracted(extractedCount);
  };

  // Handle extraction completion
  const handleExtractionComplete = () => {
    // Refetch symbols for the page
    queryClient.invalidateQueries({ queryKey: [`/api/symbols/page/${pageId}`] });
    
    toast({
      title: "Extraction complete",
      description: `${symbolsExtracted} symbols were successfully extracted`
    });
    
    setIsProcessing(false);
    // Keep the modal open to show results
  };

  // Handle threshold change
  const handleThresholdChange = (value: number[]) => {
    setConfig({ ...config, threshold: value[0] });
  };

  // Handle min size change
  const handleMinSizeChange = (value: number[]) => {
    setConfig({ ...config, minSize: value[0] });
  };

  return (
    <Dialog open={true} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">Symbol Extraction Tool</DialogTitle>
          {!isAdmin && (
            <div className="bg-amber-50 text-amber-800 p-3 rounded-md mt-2 flex items-start">
              <Shield className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Administrator Access Required</p>
                <p className="text-sm mt-1">Symbol extraction is restricted to administrators. Please contact an administrator if you need to extract symbols.</p>
              </div>
            </div>
          )}
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {!isAdmin ? (
            <div className="w-full py-8 text-center">
              <Shield className="h-10 w-10 mx-auto text-amber-500 mb-4" />
              <p className="text-neutral-600 max-w-lg mx-auto">
                You don't have access to the symbol extraction functionality. Please contact an administrator 
                if you need to extract symbols from manuscript pages.
              </p>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="mt-6"
              >
                Close
              </Button>
            </div>
          ) : (
          <>
          {/* Configuration Panel */}
          <div className="lg:w-1/3">
            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-3">Extraction Parameters</h4>
              
              <div className="space-y-4">
                {/* Preset Selection */}
                <div>
                  <Label className="text-xs text-neutral-500">Configuration Preset</Label>
                  <Select 
                    disabled={isProcessing}
                    value={config.preset}
                    onValueChange={(value) => {
                      // Apply preset configurations
                      if (value === 'high-precision') {
                        setConfig({
                          ...config,
                          preset: value,
                          threshold: 150,
                          minSize: 20,
                          maxSize: 64,
                          ignoreMargins: true
                        });
                      } else if (value === 'high-recall') {
                        setConfig({
                          ...config,
                          preset: value,
                          threshold: 100,
                          minSize: 8,
                          maxSize: 128,
                          ignoreMargins: false
                        });
                      } else {
                        setConfig({
                          ...config,
                          preset: value,
                          threshold: 128,
                          minSize: 16,
                          maxSize: 64,
                          ignoreMargins: true
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="high-precision">High Precision</SelectItem>
                      <SelectItem value="high-recall">High Recall</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Threshold Controls */}
                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs text-neutral-500">Threshold</Label>
                    <span className="text-xs text-neutral-700">{config.threshold}</span>
                  </div>
                  <Slider 
                    disabled={isProcessing}
                    value={[config.threshold]} 
                    min={0} 
                    max={255} 
                    step={1}
                    onValueChange={handleThresholdChange}
                  />
                </div>
                
                {/* Size Filters */}
                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs text-neutral-500">Minimum Symbol Size</Label>
                    <span className="text-xs text-neutral-700">{config.minSize}px</span>
                  </div>
                  <Slider 
                    disabled={isProcessing}
                    value={[config.minSize]} 
                    min={4} 
                    max={64} 
                    step={1}
                    onValueChange={handleMinSizeChange}
                  />
                </div>
                
                {/* Advanced Options Toggle */}
                <div className="pt-2">
                  <button 
                    className="text-sm text-primary hover:text-primary/90 flex items-center"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    disabled={isProcessing}
                  >
                    <Cog className="mr-1 h-4 w-4" /> Advanced Options
                    <span className="ml-1 text-xs">
                      {showAdvanced ? '▲' : '▼'}
                    </span>
                  </button>
                </div>
                
                {showAdvanced && (
                  <div className="space-y-3 pt-2 pl-4 border-l-2 border-neutral-200">
                    <div>
                      <Label className="text-xs text-neutral-500">Enhancement Preset</Label>
                      <Select 
                        disabled={isProcessing}
                        value={config.enhancementPreset}
                        onValueChange={(value) => setConfig({ ...config, enhancementPreset: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select enhancement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="high-contrast">High Contrast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="ignore-margins"
                        checked={config.ignoreMargins}
                        disabled={isProcessing}
                        onCheckedChange={(checked) => 
                          setConfig({ ...config, ignoreMargins: checked as boolean })
                        }
                      />
                      <Label 
                        htmlFor="ignore-margins"
                        className="text-sm text-neutral-700 cursor-pointer"
                      >
                        Ignore page margins
                      </Label>
                    </div>
                  </div>
                )}
                
                {/* Processing Range */}
                <div className="pt-2 border-t border-neutral-200">
                  <Label className="block text-xs text-neutral-500 mb-2">Extraction Scope</Label>
                  
                  <div className="flex space-x-1 mb-3">
                    <Badge 
                      variant={extractionMode === 'single' ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => !isProcessing && setExtractionMode('single')}
                    >
                      Single Page
                    </Badge>
                    <Badge 
                      variant={extractionMode === 'range' ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => !isProcessing && setExtractionMode('range')}
                    >
                      Page Range
                    </Badge>
                    <Badge 
                      variant={extractionMode === 'all' ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => !isProcessing && setExtractionMode('all')}
                    >
                      All Pages
                    </Badge>
                  </div>
                  
                  {extractionMode !== 'single' && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <Label className="block text-xs text-neutral-500">From</Label>
                        <Select 
                          disabled={isProcessing || extractionMode === 'all'}
                          value={range.startPageId.toString()}
                          onValueChange={(value) => setRange({ ...range, startPageId: parseInt(value) })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Start page" />
                          </SelectTrigger>
                          <SelectContent>
                            {pages.map((page: any) => (
                              <SelectItem key={`start-${page.id}`} value={page.id.toString()}>
                                Page {page.folioNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="block text-xs text-neutral-500">To</Label>
                        <Select 
                          disabled={isProcessing || extractionMode === 'all'}
                          value={range.endPageId.toString()}
                          onValueChange={(value) => setRange({ ...range, endPageId: parseInt(value) })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="End page" />
                          </SelectTrigger>
                          <SelectContent>
                            {pages.map((page: any) => (
                              <SelectItem key={`end-${page.id}`} value={page.id.toString()}>
                                Page {page.folioNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {extractionMode === 'all' && (
                    <div className="text-sm text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-200 mb-2">
                      This will extract symbols from all {pages.length} pages using the same parameters.
                      This operation may take several minutes to complete.
                    </div>
                  )}
                </div>
                
                {/* Start Button */}
                <div className="pt-4">
                  <Button 
                    className="w-full"
                    onClick={handleStartExtraction}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Start Extraction'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview Area */}
          <div className="lg:w-2/3">
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <div className="h-64 bg-neutral-100 flex items-center justify-center relative">
                {isProcessing ? (
                  <div className="absolute inset-0 bg-neutral-900/80 flex flex-col items-center justify-center text-white p-4">
                    <div className="mb-4">
                      <div className="text-center mb-2">Processing Page {folioNumber}</div>
                      <div className="w-64 bg-neutral-700 rounded-full h-2">
                        <div 
                          className="bg-secondary h-2 rounded-full" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-center mt-1">
                        Step {step}/4: {
                          step === 1 ? 'Preprocessing' : 
                          step === 2 ? 'Character Detection' : 
                          step === 3 ? 'Feature Extraction' : 
                          'Symbol Classification'
                        }
                      </div>
                    </div>
                    <div className="text-sm text-neutral-300 text-center max-w-md">
                      The system is analyzing the manuscript page to identify and extract individual symbols. This process may take several minutes depending on image complexity.
                    </div>
                  </div>
                ) : symbolsExtracted > 0 ? (
                  <div className="p-6 text-center">
                    <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-2 mb-4">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Extraction Complete</h3>
                    <p className="text-neutral-600 mb-4">
                      Successfully extracted {symbolsExtracted} symbols from page {folioNumber}
                    </p>
                    <Button
                      variant="outline"
                      onClick={onClose}
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <h3 className="text-lg font-medium mb-1">Ready to Extract Symbols</h3>
                    <p className="text-neutral-600 text-sm mb-4">
                      Configure your extraction parameters and click "Start Extraction" when ready.
                    </p>
                    <div className="flex justify-center">
                      <img 
                        src={`/uploads/${folioNumber ? `page_${folioNumber}.png` : ''}`}
                        alt="Page preview"
                        className="max-h-32 opacity-50"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {symbolsExtracted > 0 && (
                <div className="p-4 border-t border-neutral-200">
                  <h4 className="text-sm font-medium text-neutral-700 mb-3">Extracted Symbols Preview</h4>
                  
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: Math.min(18, symbolsExtracted) }).map((_, i) => (
                      <Card key={i} className="aspect-square flex items-center justify-center relative hover:border-primary cursor-pointer">
                        <div className="w-2/3 h-2/3 flex items-center justify-center text-neutral-800">
                          {/* In a real implementation, these would be actual extracted symbols */}
                          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d={[
                              "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
                              "M18 4h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1",
                              "M12 7v4",
                              "M10 9h4",
                              "M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z",
                              "M22 12h-4l-3 9L9 3l-3 9H2",
                              "M5 12h14",
                              "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
                              "M9 11l3 3L22 4"
                            ][i % 9]}></path>
                          </svg>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => {
                      onClose();
                      window.location.href = `/symbols?pageId=${pageId}`;
                    }}>
                      View All Results ({symbolsExtracted})
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            {symbolsExtracted > 0 ? 'Close' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SymbolExtraction;

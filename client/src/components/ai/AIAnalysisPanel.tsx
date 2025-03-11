import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Switch
} from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Share2, Info, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIAnalysisPanelProps {
  pageId: number;
  folioNumber?: string;
}

interface AIModel {
  id: string;
  name: string;
  creditCost: number;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ pageId, folioNumber }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(500);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [showCreditAlert, setShowCreditAlert] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { toast } = useToast();
  
  // Get available models
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/ai/models'],
    retry: false,
    onSuccess: (data) => {
      if (data.models?.length > 0 && !selectedModel) {
        setSelectedModel(data.models[0].id);
      }
    }
  });
  
  // Get user credits
  const { data: creditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ['/api/ai/credits'],
    retry: false,
  });
  
  // Get previous analysis results for this page
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['/api/ai/results'],
    retry: false,
  });
  
  const models: AIModel[] = modelsData?.models || [];
  const credits = creditsData?.credits || 0;
  const pageResults = resultsData?.results?.filter((r: any) => r.pageId === pageId) || [];
  
  // AI analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/ai/analyze', data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setAnalysisResult(data.result);
      queryClient.invalidateQueries({ queryKey: ['/api/ai/credits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/results'] });
      
      toast({
        title: "Analysis complete",
        description: "AI analysis has been completed successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Social sharing mutation
  const shareMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/ai/share/${data.id}`, {
        publiclyVisible: data.publiclyVisible,
        generateLink: data.generateLink,
        allowComments: data.allowComments
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      if (data.result?.shareToken) {
        const shareUrl = `${window.location.origin}/shared/${data.result.shareToken}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        
        toast({
          title: "Share link created",
          description: "Link copied to clipboard"
        });
      } else {
        toast({
          title: "Visibility updated",
          description: data.result?.isPublic ? 
            "Analysis is now public in the gallery" : 
            "Analysis is now private"
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/ai/results'] });
    },
    onError: (error) => {
      toast({
        title: "Sharing failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Get selected model info
  const getSelectedModel = () => {
    return models.find(m => m.id === selectedModel);
  };
  
  // Check if user has enough credits
  const hasEnoughCredits = () => {
    const model = getSelectedModel();
    if (!model) return false;
    return credits >= model.creditCost;
  };
  
  // Handle form submission
  const handleAnalyze = () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt for the analysis",
        variant: "destructive"
      });
      return;
    }
    
    if (!hasEnoughCredits()) {
      setShowCreditAlert(true);
      return;
    }
    
    const model = getSelectedModel();
    if (!model) {
      toast({
        title: "Model selection error",
        description: "Please select a valid model",
        variant: "destructive"
      });
      return;
    }
    
    analysisMutation.mutate({
      pageId,
      prompt,
      modelParams: {
        model: selectedModel,
        temperature,
        maxTokens
      },
      isPublic
    });
  };
  
  // Handle sharing an analysis result
  const handleShare = (resultId: number) => {
    shareMutation.mutate({
      id: resultId,
      publiclyVisible: true,
      generateLink: true,
      allowComments: true
    });
  };
  
  // Format AI response for display
  const formatAIResponse = (result: any) => {
    if (!result || !result.result) return 'No data available';
    
    try {
      const aiData = result.result;
      if (aiData.choices && aiData.choices.length > 0) {
        return aiData.choices[0].message.content;
      }
      
      // Fallback to raw JSON if we can't parse nicely
      return JSON.stringify(aiData, null, 2);
    } catch (error) {
      return 'Error parsing AI response';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>AI Analysis</span>
              <Badge variant="outline" className="flex items-center">
                <Sparkles className="h-3 w-3 mr-1 text-secondary" />
                {credits} Credits
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt">Your Analysis Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Ask a question about this page of the Voynich Manuscript..."
                  className="h-32"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={analysisMutation.isPending}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={modelsLoading || analysisMutation.isPending}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(model => (
                        <SelectItem 
                          key={model.id} 
                          value={model.id}
                        >
                          {model.name} ({model.creditCost} {model.creditCost === 1 ? 'credit' : 'credits'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="max-tokens">Max Output Length</Label>
                  <Select
                    value={maxTokens.toString()}
                    onValueChange={(value) => setMaxTokens(parseInt(value))}
                    disabled={analysisMutation.isPending}
                  >
                    <SelectTrigger id="max-tokens">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="250">Short (250 tokens)</SelectItem>
                      <SelectItem value="500">Medium (500 tokens)</SelectItem>
                      <SelectItem value="1000">Long (1000 tokens)</SelectItem>
                      <SelectItem value="2000">Very Long (2000 tokens)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Temperature (Creativity)</Label>
                  <span className="text-sm text-neutral-500">{temperature}</span>
                </div>
                <Slider
                  value={[temperature]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => setTemperature(value[0])}
                  disabled={analysisMutation.isPending}
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  disabled={analysisMutation.isPending}
                />
                <Label htmlFor="public">Share in public gallery</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <div className="text-sm text-neutral-500 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {getSelectedModel()?.creditCost || 1} credit{getSelectedModel()?.creditCost !== 1 && 's'} per analysis
            </div>
            <Button 
              onClick={handleAnalyze}
              disabled={!prompt.trim() || !selectedModel || analysisMutation.isPending}
            >
              {analysisMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Run Analysis'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Page Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-neutral-500">Page</Label>
                <p className="font-medium">{folioNumber || `ID: ${pageId}`}</p>
              </div>
              
              {pageResults.length > 0 && (
                <div>
                  <Label className="text-neutral-500">Previous Analyses</Label>
                  <p className="text-sm">{pageResults.length} analyses performed</p>
                  <div className="mt-2 space-y-2">
                    {pageResults.slice(0, 3).map((result: any) => (
                      <Button 
                        key={result.id} 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-between"
                        onClick={() => setAnalysisResult(result)}
                      >
                        <span className="truncate max-w-[180px]">
                          {result.prompt?.substring(0, 20)}...
                        </span>
                        <Share2 
                          className="h-4 w-4 ml-2 text-neutral-400 hover:text-primary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(result.id);
                          }}
                        />
                      </Button>
                    ))}
                    {pageResults.length > 3 && (
                      <div className="text-center text-sm text-neutral-500">
                        + {pageResults.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-neutral-500">Prompt Ideas</Label>
                <div className="mt-2 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setPrompt("Can you identify any patterns in the symbols on this page that might suggest it's a natural scientific text?")}
                  >
                    <span className="truncate">Identify symbol patterns...</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setPrompt("Based on the illustrations, what subject matter does this page of the manuscript likely cover?")}
                  >
                    <span className="truncate">Analyze illustrations...</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setPrompt("Compare this page with known medieval herbals. Are there any similarities in structure or content?")}
                  >
                    <span className="truncate">Compare with medieval herbals...</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Results Section */}
      {analysisResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Analysis Results</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleShare(analysisResult.id)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="results">
              <TabsList>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>
              <TabsContent value="results" className="mt-4">
                <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {formatAIResponse(analysisResult)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="prompt" className="mt-4">
                <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                  <p className="whitespace-pre-wrap">{analysisResult.prompt}</p>
                </div>
              </TabsContent>
              <TabsContent value="metadata" className="mt-4">
                <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <dt className="font-medium">Model</dt>
                    <dd>{analysisResult.model}</dd>
                    <dt className="font-medium">Created</dt>
                    <dd>{new Date(analysisResult.createdAt).toLocaleString()}</dd>
                    <dt className="font-medium">Visibility</dt>
                    <dd>{analysisResult.isPublic ? 'Public' : 'Private'}</dd>
                    <dt className="font-medium">Share Link</dt>
                    <dd>
                      {analysisResult.shareToken ? (
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-primary"
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/shared/${analysisResult.shareToken}`;
                            navigator.clipboard.writeText(shareUrl);
                            toast({
                              title: "Share link copied",
                              description: "Link copied to clipboard"
                            });
                          }}
                        >
                          Copy link
                        </Button>
                      ) : (
                        <span className="text-neutral-500">No share link</span>
                      )}
                    </dd>
                  </dl>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Credit Alert Dialog */}
      <AlertDialog open={showCreditAlert} onOpenChange={setShowCreditAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-warning mr-2" />
              Insufficient Credits
            </AlertDialogTitle>
            <AlertDialogDescription>
              You don't have enough credits to perform this analysis. 
              {getSelectedModel() && 
                ` This model requires ${getSelectedModel()?.creditCost} credits, but you only have ${credits}.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant="default" 
                onClick={() => {
                  setShowCreditAlert(false);
                  window.location.href = '/credits';
                }}
              >
                Purchase Credits
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIAnalysisPanel;

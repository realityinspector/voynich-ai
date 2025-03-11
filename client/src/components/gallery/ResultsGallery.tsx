import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Share2, Search, Eye, Calendar, User, Tag, ThumbsUp, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ResultsGalleryProps {
  initialFilter?: {
    type?: string;
    userId?: number;
    pageId?: number;
  };
}

const ResultsGallery: React.FC<ResultsGalleryProps> = ({ initialFilter }) => {
  const [filter, setFilter] = useState({
    type: initialFilter?.type || 'all',
    searchTerm: '',
    sortBy: 'newest'
  });
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const { toast } = useToast();
  
  // Fetch public analysis results
  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['/api/ai/gallery'],
    retry: false,
  });
  
  const results = resultsData?.results || [];
  
  // Apply filters
  const filteredResults = results.filter((result: any) => {
    // Filter by type
    if (filter.type !== 'all' && result.type !== filter.type) {
      return false;
    }
    
    // Filter by user ID if specified in initialFilter
    if (initialFilter?.userId && result.userId !== initialFilter.userId) {
      return false;
    }
    
    // Filter by page ID if specified in initialFilter
    if (initialFilter?.pageId && result.pageId !== initialFilter.pageId) {
      return false;
    }
    
    // Search term filtering (search in prompt, model, and user info if available)
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      const promptMatch = result.prompt?.toLowerCase().includes(searchLower);
      const modelMatch = result.model?.toLowerCase().includes(searchLower);
      const userMatch = result.user?.username?.toLowerCase().includes(searchLower);
      
      return promptMatch || modelMatch || userMatch;
    }
    
    return true;
  });
  
  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (filter.sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (filter.sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });
  
  // Format AI response for display
  const formatAIResponse = (result: any) => {
    if (!result || !result.result) return 'No data available';
    
    try {
      const aiData = result.result;
      if (aiData.choices && aiData.choices.length > 0) {
        // Get just the first 150 characters for the preview
        return aiData.choices[0].message.content.substring(0, 150) + '...';
      }
      
      // Fallback to raw JSON if we can't parse nicely
      return JSON.stringify(aiData, null, 2).substring(0, 150) + '...';
    } catch (error) {
      return 'Error parsing AI response';
    }
  };
  
  // Get full AI response
  const getFullAIResponse = (result: any) => {
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
  
  // Handle sharing result
  const handleShare = (result: any) => {
    if (result.shareToken) {
      const shareUrl = `${window.location.origin}/shared/${result.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Share link copied",
        description: "Link copied to clipboard"
      });
    } else {
      toast({
        title: "No share link available",
        description: "This result doesn't have a share link.",
        variant: "destructive"
      });
    }
  };
  
  // Get analysis type display name
  const getAnalysisTypeName = (type: string) => {
    switch (type) {
      case 'symbol_extraction': return 'Symbol Extraction';
      case 'translation_attempt': return 'Translation Attempt';
      case 'pattern_analysis': return 'Pattern Analysis';
      case 'custom_prompt': return 'Custom Prompt';
      default: return type;
    }
  };
  
  // Get model display name
  const getModelDisplayName = (modelId: string) => {
    if (!modelId) return 'Unknown model';
    
    const modelMap: Record<string, string> = {
      'mixtral-8x7b-instruct': 'Mixtral 8x7B',
      'llama-2-70b-chat': 'Llama 2 70B',
      'claude-3-opus-20240229': 'Claude 3 Opus',
    };
    
    return modelMap[modelId] || modelId;
  };
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search analyses..."
                className="pl-10"
                value={filter.searchTerm}
                onChange={(e) => setFilter({ ...filter, searchTerm: e.target.value })}
              />
            </div>
            
            <div className="flex gap-4">
              <Select
                value={filter.type}
                onValueChange={(value) => setFilter({ ...filter, type: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Analysis Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="symbol_extraction">Symbol Extraction</SelectItem>
                  <SelectItem value="translation_attempt">Translation Attempt</SelectItem>
                  <SelectItem value="pattern_analysis">Pattern Analysis</SelectItem>
                  <SelectItem value="custom_prompt">Custom Prompt</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filter.sortBy}
                onValueChange={(value) => setFilter({ ...filter, sortBy: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading states
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="h-12 bg-neutral-100"></CardHeader>
              <CardContent className="h-40 bg-neutral-50"></CardContent>
              <CardFooter className="h-10 bg-neutral-100"></CardFooter>
            </Card>
          ))
        ) : sortedResults.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-lg text-neutral-500">No analysis results found.</p>
            {filter.searchTerm || filter.type !== 'all' ? (
              <Button 
                variant="link" 
                onClick={() => setFilter({ type: 'all', searchTerm: '', sortBy: 'newest' })}
              >
                Clear filters
              </Button>
            ) : (
              <p className="text-sm text-neutral-400 mt-2">
                Run your first analysis to see results here.
              </p>
            )}
          </div>
        ) : (
          sortedResults.map((result: any) => (
            <Card key={result.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center">
                    {result.type && (
                      <Badge variant="outline" className="mr-2">
                        {getAnalysisTypeName(result.type)}
                      </Badge>
                    )}
                    <span className="truncate">{result.prompt?.substring(0, 30) || 'Untitled Analysis'}...</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-neutral-600 mb-4">
                  {formatAIResponse(result)}
                </p>
                <div className="flex items-center text-xs text-neutral-500 space-x-4">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
                  </span>
                  <span className="flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    {getModelDisplayName(result.model)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => setSelectedResult(result)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => handleShare(result)}
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Result Detail Dialog */}
      {selectedResult && (
        <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">{selectedResult.prompt?.substring(0, 60) || 'Analysis Result'}{selectedResult.prompt?.length > 60 ? '...' : ''}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="result">
              <TabsList>
                <TabsTrigger value="result">Analysis Result</TabsTrigger>
                <TabsTrigger value="info">Information</TabsTrigger>
              </TabsList>
              
              <TabsContent value="result" className="mt-4">
                <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 max-h-[60vh] overflow-y-auto">
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {getFullAIResponse(selectedResult)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="info" className="mt-4">
                <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Prompt</h3>
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                        {selectedResult.prompt || 'No prompt available'}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Analysis Information</h3>
                        <dl className="grid grid-cols-2 gap-y-2 text-sm">
                          <dt className="text-neutral-500">Type</dt>
                          <dd>{getAnalysisTypeName(selectedResult.type)}</dd>
                          
                          <dt className="text-neutral-500">Model</dt>
                          <dd>{getModelDisplayName(selectedResult.model)}</dd>
                          
                          <dt className="text-neutral-500">Created</dt>
                          <dd>{new Date(selectedResult.createdAt).toLocaleString()}</dd>
                          
                          <dt className="text-neutral-500">Page</dt>
                          <dd>{selectedResult.page?.folioNumber || `ID: ${selectedResult.pageId}`}</dd>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Engagement</h3>
                        <div className="flex space-x-4">
                          <Button variant="outline" size="sm" className="text-xs">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Like
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Comment
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => handleShare(selectedResult)}>
                            <Share2 className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedResult(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ResultsGallery;

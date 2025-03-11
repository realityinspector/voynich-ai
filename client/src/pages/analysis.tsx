import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useManuscript } from '@/hooks/useManuscript';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';

export default function Analysis() {
  const [location] = useLocation();
  const { useManuscriptPages, useManuscriptPage } = useManuscript();
  const { toast } = useToast();
  
  // Get query parameters
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const pageIdParam = searchParams.get('pageId');
  const resultIdParam = searchParams.get('resultId');
  
  // State
  const [selectedPageId, setSelectedPageId] = useState<number | undefined>(
    pageIdParam ? parseInt(pageIdParam) : undefined
  );
  
  // Fetch manuscript pages
  const { data: pagesData, isLoading: pagesLoading } = useManuscriptPages();
  
  // Fetch selected page
  const { data: pageData, isLoading: pageLoading } = useManuscriptPage(selectedPageId);
  
  // Fetch user credits
  const { data: creditsData } = useQuery({
    queryKey: ['/api/ai/credits'],
    retry: false,
  });
  
  // Get data from queries
  const pages = pagesData?.pages || [];
  const page = pageData?.page;
  const credits = creditsData?.credits || 0;
  
  // Update selected page if none is selected
  useEffect(() => {
    if (!selectedPageId && pages.length > 0 && !pagesLoading) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, pagesLoading, selectedPageId]);
  
  // If result ID is provided, fetch and display it
  useEffect(() => {
    if (resultIdParam) {
      // This would be implemented to fetch the specific result
      // For now, just show a toast
      toast({
        title: "Analysis Result",
        description: "Viewing analysis result ID: " + resultIdParam,
      });
    }
  }, [resultIdParam, toast]);
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">AI Analysis</h1>
          <p className="text-neutral-600">
            Use advanced AI models to analyze and interpret the Voynich Manuscript.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={selectedPageId?.toString() || ''}
            onValueChange={(value) => setSelectedPageId(parseInt(value))}
            disabled={pagesLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a page" />
            </SelectTrigger>
            <SelectContent>
              {pages.map(page => (
                <SelectItem key={page.id} value={page.id.toString()}>
                  Page {page.folioNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="history">Analysis History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis">
          {!selectedPageId ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>Select a manuscript page to analyze.</p>
              </CardContent>
            </Card>
          ) : (
            <AIAnalysisPanel 
              pageId={selectedPageId} 
              folioNumber={page?.folioNumber}
            />
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>
                View your previous AI analyses across all pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* This would be populated with actual analysis history */}
                <p className="text-center text-neutral-500 py-4">
                  Your previous analyses will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

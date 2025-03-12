import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Share2 } from 'lucide-react';
import { formatAIResponse } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

// Page for viewing a specific analysis result
export default function AnalysisResult() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch the analysis result
  const { data, isLoading, isError } = useQuery({
    queryKey: [`/api/ai/analysis/${id}`],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });
  
  const analysis = data?.analysis;
  const page = data?.page;
  
  // Handle copy share link
  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/analysis/${analysis.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share link copied",
      description: "Link copied to clipboard"
    });
  };
  
  // Handle going back to AI Analysis page
  const handleBackToAnalysis = () => {
    navigate(`/analysis?pageId=${analysis?.pageId}`);
  };
  
  if (isLoading) {
    return (
      <div className="container py-10 max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-32 bg-muted rounded w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isError || !analysis) {
    return (
      <div className="container py-10 max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold mb-2">Analysis Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The analysis result you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={() => navigate('/analysis')}>
                Back to AI Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Extract the AI response to display
  const choices = analysis.result.choices || [];
  const analysisText = choices.length > 0 
    ? choices[0].message?.content || choices[0].text || 'No analysis content available'
    : 'No analysis content available';
  
  // Determine if user is the owner of this analysis
  const isOwner = user && user.id === analysis.userId;
  
  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={handleBackToAnalysis}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to AI Analysis
        </Button>
        
        {isOwner && (
          <Button variant="outline" size="sm" onClick={handleCopyShareLink}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Analysis
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold mb-1">AI Analysis Result</CardTitle>
              <div className="text-sm text-muted-foreground">
                {page?.folioNumber && (
                  <span>Folio {page.folioNumber}</span>
                )}
                <span className="mx-2">•</span>
                <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>Model: {analysis.model.split('/').pop()}</span>
              </div>
            </div>
          </div>
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
                  <div 
                    className="whitespace-pre-wrap font-sans text-sm"
                    dangerouslySetInnerHTML={{ __html: formatAIResponse(analysisText) }}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="prompt" className="mt-4">
              <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                <p className="whitespace-pre-wrap">{analysis.prompt}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="metadata" className="mt-4">
              <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <dt className="font-medium">Analysis ID</dt>
                  <dd>{analysis.id}</dd>
                  
                  <dt className="font-medium">Created</dt>
                  <dd>{new Date(analysis.createdAt).toLocaleString()}</dd>
                  
                  <dt className="font-medium">Model</dt>
                  <dd>{analysis.model}</dd>
                  
                  <dt className="font-medium">Visibility</dt>
                  <dd>{analysis.isPublic ? 'Public' : 'Private'}</dd>
                  
                  <dt className="font-medium">Folio</dt>
                  <dd>{page?.folioNumber || 'Unknown'}</dd>
                </dl>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
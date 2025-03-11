import { useState } from 'react';
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
import ResultsGallery from '@/components/gallery/ResultsGallery';
import { useAuth } from '@/hooks/useAuth';

export default function Gallery() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Get query parameters
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const initialTabParam = searchParams.get('tab');
  const typeParam = searchParams.get('type');
  const userIdParam = searchParams.get('userId');
  
  // State
  const [activeTab, setActiveTab] = useState(initialTabParam || 'public');
  
  // Extract filter from URL params
  const initialFilter = {
    type: typeParam || undefined,
    userId: userIdParam ? parseInt(userIdParam) : undefined
  };
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Analysis Gallery</h1>
        <p className="text-neutral-600">
          Explore and share insights from the Voynich Manuscript research community.
        </p>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="public">Public Gallery</TabsTrigger>
          <TabsTrigger value="personal">My Analyses</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>
        
        <TabsContent value="public">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Public Analysis Gallery</CardTitle>
                <CardDescription>
                  Analysis results shared by the research community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResultsGallery initialFilter={initialFilter} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="personal">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Analysis Results</CardTitle>
                <CardDescription>
                  View and manage your own analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResultsGallery 
                  initialFilter={{ 
                    ...initialFilter,
                    userId: user?.id 
                  }} 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="featured">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Featured Analyses</CardTitle>
                <CardDescription>
                  Highlighted and notable research findings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-neutral-500">
                    Featured analyses will be shown here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

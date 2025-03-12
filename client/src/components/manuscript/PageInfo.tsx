import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card,
  CardContent
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Bot, History } from 'lucide-react';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';

interface PageInfoProps {
  page: any;
  symbolCount: number;
}

const PageInfo: React.FC<PageInfoProps> = ({ page, symbolCount }) => {
  const [activeTab, setActiveTab] = useState("info");
  
  // Fetch annotations for the page
  const { data: annotationsData } = useQuery({
    queryKey: [`/api/annotations/page/${page.id}`],
    retry: false,
  });
  
  const annotations = annotationsData?.annotations || [];
  
  // Calculate symbol statistics 
  const uniqueSymbolCount = new Set(
    symbolCount ? Array.from({length: symbolCount}, (_, i) => i).map(i => 
      // This is a placeholder; in a real app we'd use symbol.category or similar
      Math.floor(Math.random() * 20)
    ) : []
  ).size;
  
  const classifiedSymbolCount = Math.floor(uniqueSymbolCount * 0.7); // In a real app, this would come from the API
  
  // Mock recent activity - in a real implementation, this would be fetched from an API
  const recentActivity = [
    {
      id: 1,
      type: 'symbol_extraction',
      description: `${symbolCount} symbols extracted with configuration "High Precision"`,
      date: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
    },
    {
      id: 2,
      type: 'note_added',
      description: 'Dr. Smith commented on recurring plant structure',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
    }
  ];

  return (
    <div className="w-full md:w-80 bg-white border border-neutral-200 rounded-lg shadow-sm flex flex-col">
      {/* Tabs */}
      <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-neutral-200">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="info"
              className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              Page Info
            </TabsTrigger>
            <TabsTrigger 
              value="symbols"
              className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              Symbols
            </TabsTrigger>
            <TabsTrigger 
              value="notes"
              className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              Notes
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <TabsContent value="info" className="mt-0 h-full">
            <div>
              <h3 className="text-lg font-heading font-semibold text-neutral-800 mb-2">Page {page.folioNumber}</h3>
              <div className="space-y-4">
                {/* Metadata */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-600 mb-1">Metadata</h4>
                  <div className="bg-neutral-100 p-3 rounded-md text-sm">
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="text-neutral-600">Folio:</div>
                      <div>{page.folioNumber}</div>
                      <div className="text-neutral-600">Section:</div>
                      <div className="capitalize">{page.section || 'Unknown'}</div>
                      <div className="text-neutral-600">Resolution:</div>
                      <div>{page.width || '?'} x {page.height || '?'}</div>
                      <div className="text-neutral-600">Updated:</div>
                      <div>{page.uploadedAt ? formatDistanceToNow(new Date(page.uploadedAt), { addSuffix: true }) : 'Unknown'}</div>
                    </div>
                  </div>
                </div>
                
                {/* Symbol Statistics */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-600 mb-1">Symbol Statistics</h4>
                  <div className="bg-neutral-100 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Extracted Symbols</span>
                      <span className="text-sm font-medium">{symbolCount}</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-secondary h-2 rounded-full" 
                        style={{ width: `${Math.min(100, symbolCount / 3)}%` }}
                      ></div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 bg-white rounded">
                        <span>Unique:</span>
                        <span className="font-medium">{uniqueSymbolCount}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-white rounded">
                        <span>Classified:</span>
                        <span className="font-medium">{classifiedSymbolCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-600 mb-1">Recent Activity</h4>
                  <div className="space-y-2">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className="text-sm p-2 bg-neutral-100 rounded-md">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">
                            {activity.type === 'symbol_extraction' ? 'Symbol extraction run' : 'Note added'}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {formatDistanceToNow(activity.date, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-neutral-600 text-xs">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2">
                  <Link href={`/analysis?pageId=${page.id}`}>
                    <button className="flex-1 py-2 px-3 bg-primary text-white text-sm rounded hover:bg-primary/90">
                      <Bot className="inline-block mr-1 h-4 w-4" /> AI Analysis
                    </button>
                  </Link>
                  <button className="flex-1 py-2 px-3 bg-neutral-200 text-neutral-800 text-sm rounded hover:bg-neutral-300">
                    <History className="inline-block mr-1 h-4 w-4" /> History
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="symbols" className="mt-0">
            <div>
              <h3 className="text-lg font-heading font-semibold text-neutral-800 mb-2">Symbols</h3>
              {symbolCount > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-600">
                    This page contains {symbolCount} extracted symbols.
                    Click on a symbol to view its details.
                  </p>
                  
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: Math.min(18, symbolCount) }).map((_, i) => (
                      <div 
                        key={i} 
                        className="aspect-square border border-neutral-200 rounded bg-neutral-50 flex items-center justify-center hover:border-primary cursor-pointer"
                      >
                        {/* This would show actual symbol images in a real implementation */}
                        <div className="w-2/3 h-2/3 flex items-center justify-center text-neutral-800">
                          {/* Placeholder SVG - would be real symbol in implementation */}
                          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d={[
                              "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
                              "M10 17l5-5-5-5",
                              "M12 12h.01",
                              "M12 2a8 8 0 0 0-8 8v12",
                              "M5 12h14",
                              "M12 2a8 8 0 0 1 8 8"
                            ][i % 6]}></path>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <Link href={`/symbol-gallery?pageId=${page.id}`}>
                      <button className="px-4 py-2 bg-primary text-white text-sm rounded hover:bg-primary/90">
                        View All Symbols
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-100 p-4 rounded-md text-center">
                  <p className="text-neutral-600 mb-2">No symbols have been extracted yet.</p>
                  <button className="px-4 py-2 bg-primary text-white text-sm rounded hover:bg-primary/90">
                    Extract Symbols
                  </button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <div>
              <h3 className="text-lg font-heading font-semibold text-neutral-800 mb-2">Notes & Annotations</h3>
              
              {annotations.length > 0 ? (
                <div className="space-y-4">
                  {annotations.map(annotation => (
                    <Card key={annotation.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">{annotation.user?.username || 'Researcher'}</span>
                          <span className="text-xs text-neutral-500">
                            {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{annotation.content}</p>
                        <div className="text-xs text-neutral-500 mt-1">
                          Position: ({annotation.x},{annotation.y}) to ({annotation.x + annotation.width},{annotation.y + annotation.height})
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-100 p-4 rounded-md text-center">
                  <p className="text-neutral-600 mb-2">No annotations have been added yet.</p>
                  <Link href={`/annotations?pageId=${page.id}`}>
                    <button className="px-4 py-2 bg-primary text-white text-sm rounded hover:bg-primary/90">
                      Add Annotation
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default PageInfo;

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useManuscript } from '@/hooks/useManuscript';
import { useSymbols } from '@/hooks/useSymbols';
import SymbolExtraction from '@/components/manuscript/SymbolExtraction';
import SymbolPositionViewer from '@/components/symbols/SymbolPositionViewer';
import { 
  Puzzle, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  BarChart3, 
  Tag, 
  X, 
  ListFilter,
  CheckCircle2,
  Ban,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';

export default function Symbols() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { useManuscriptPages, useManuscriptPage, useExtractionJobs } = useManuscript();
  const { usePageSymbols } = useSymbols();
  
  // Get query parameters
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const initialTabParam = searchParams.get('tab');
  const pageIdParam = searchParams.get('pageId');
  
  // State
  const [activeTab, setActiveTab] = useState(initialTabParam || 'extraction');
  const [selectedPageId, setSelectedPageId] = useState<number | undefined>(
    pageIdParam ? parseInt(pageIdParam) : undefined
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [extractionModalOpen, setExtractionModalOpen] = useState(false);
  
  // Fetch manuscript pages
  const { data: pagesData, isLoading: pagesLoading } = useManuscriptPages();
  
  // Fetch current page details
  const { data: pageData, isLoading: pageLoading } = useManuscriptPage(selectedPageId);
  
  // Fetch extraction jobs
  const { data: jobsData, isLoading: jobsLoading } = useExtractionJobs();
  
  // Fetch symbols for selected page
  const { data: symbolsData, isLoading: symbolsLoading } = usePageSymbols(selectedPageId);
  
  // Get page and symbols from the data
  const page = pageData?.page;
  const symbols = symbolsData?.symbols || [];
  const pages = pagesData?.pages || [];
  const extractionJobs = jobsData?.jobs || [];
  
  // Update selected page if needed
  useEffect(() => {
    if (!selectedPageId && pages.length > 0 && !pagesLoading) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, pagesLoading, selectedPageId]);
  
  // Mock symbol categories for visualization
  const categories = [
    { name: 'Unknown', count: symbols.filter(s => !s.category).length },
    { name: 'Character', count: symbols.filter(s => s.category === 'character').length || 8 },
    { name: 'Diagram', count: symbols.filter(s => s.category === 'diagram').length || 4 },
    { name: 'Plant', count: symbols.filter(s => s.category === 'plant').length || 6 },
    { name: 'Astronomical', count: symbols.filter(s => s.category === 'astronomical').length || 3 },
    { name: 'Decorative', count: symbols.filter(s => s.category === 'decorative').length || 5 }
  ];
  
  // Filter symbols based on search and category
  const filteredSymbols = symbols.filter(symbol => {
    // Apply category filter
    if (categoryFilter !== 'all' && symbol.category !== categoryFilter) {
      return false;
    }
    
    // Apply search term (searching in metadata, will be improved in a real implementation)
    if (searchTerm && symbol.metadata) {
      const metadata = JSON.stringify(symbol.metadata).toLowerCase();
      return metadata.includes(searchTerm.toLowerCase());
    }
    
    return true;
  });
  
  // Chart colors
  const chartColors = ['#1a5276', '#d4ac0d', '#ca6f1e', '#2e86c1', '#28b463', '#cb4335'];
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Symbol Analysis</h1>
          <p className="text-neutral-600">
            Extract, categorize, and analyze symbols from the Voynich Manuscript.
          </p>
        </div>
        
        <div className="flex space-x-2">
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
          
          {isAdmin && (
            <Button
              onClick={() => setExtractionModalOpen(true)}
              disabled={!selectedPageId}
            >
              <Puzzle className="mr-2 h-4 w-4" />
              Extract Symbols
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="extraction">Extraction</TabsTrigger>
          <TabsTrigger value="classification">Classification</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        {/* Extraction Tab */}
        <TabsContent value="extraction" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Symbol Extraction Jobs</CardTitle>
              <CardDescription>
                Recent symbol extraction tasks and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto text-neutral-300 animate-spin" />
                  <p className="mt-2 text-neutral-500">Loading extraction jobs...</p>
                </div>
              ) : extractionJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Puzzle className="h-8 w-8 mx-auto text-neutral-300" />
                  <p className="mt-2 text-neutral-500">No extraction jobs yet</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setExtractionModalOpen(true)}
                    className="mt-2"
                  >
                    Start a new extraction
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {extractionJobs.map(job => (
                    <div key={job.id} className="flex items-center border rounded-md p-3">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium">
                            Pages {job.startPage?.folioNumber} to {job.endPage?.folioNumber}
                          </span>
                          <Badge 
                            variant={job.status === 'completed' ? 'default' : 'outline'}
                            className="ml-2"
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-neutral-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(job.startedAt).toLocaleString()}
                          {job.symbolsExtracted > 0 && (
                            <span className="ml-2">• {job.symbolsExtracted} symbols extracted</span>
                          )}
                        </div>
                        {job.status !== 'completed' && (
                          <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <div>
                        {job.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : job.status === 'failed' ? (
                          <Ban className="h-5 w-5 text-destructive" />
                        ) : (
                          <Clock className="h-5 w-5 text-primary animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Extraction Parameters</CardTitle>
              <CardDescription>
                Configure parameters for symbol extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Threshold Method</Label>
                    <Select defaultValue="adaptive">
                      <SelectTrigger>
                        <SelectValue placeholder="Select threshold method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="otsu">Otsu</SelectItem>
                        <SelectItem value="adaptive">Adaptive</SelectItem>
                        <SelectItem value="simple">Simple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Threshold Value</Label>
                    <div className="flex items-center space-x-2">
                      <Input type="number" defaultValue="128" min="0" max="255" />
                      <span className="text-sm text-neutral-500">(0-255)</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Minimum Symbol Size</Label>
                    <div className="flex items-center space-x-2">
                      <Input type="number" defaultValue="16" min="4" max="100" />
                      <span className="text-sm text-neutral-500">pixels</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Enhancement Preset</Label>
                    <Select defaultValue="none">
                      <SelectTrigger>
                        <SelectValue placeholder="Select enhancement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="high-contrast">High Contrast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Contour Detection</Label>
                    <Select defaultValue="simple">
                      <SelectTrigger>
                        <SelectValue placeholder="Select contour method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="tc89-l1">TC89 L1</SelectItem>
                        <SelectItem value="tc89-kcos">TC89 KCOS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      onClick={() => setExtractionModalOpen(true)}
                      className="w-full"
                    >
                      Configure & Run Extraction
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Classification Tab */}
        <TabsContent value="classification" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle>Symbol Classification</CardTitle>
                  <CardDescription>
                    {page ? `Symbols from page ${page.folioNumber}` : 'Select a page to view symbols'}
                  </CardDescription>
                </div>
                
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      className="pl-10 w-60"
                      placeholder="Search symbols..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="character">Characters</SelectItem>
                      <SelectItem value="diagram">Diagrams</SelectItem>
                      <SelectItem value="plant">Plants</SelectItem>
                      <SelectItem value="astronomical">Astronomical</SelectItem>
                      <SelectItem value="decorative">Decorative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedPageId ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">Select a page to view symbols</p>
                </div>
              ) : symbolsLoading ? (
                <div className="text-center py-8">
                  <Puzzle className="h-8 w-8 mx-auto text-neutral-300 animate-pulse" />
                  <p className="mt-2 text-neutral-500">Loading symbols...</p>
                </div>
              ) : symbols.length === 0 ? (
                <div className="text-center py-8">
                  <Puzzle className="h-8 w-8 mx-auto text-neutral-300" />
                  <p className="mt-2 text-neutral-500">No symbols extracted yet</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setExtractionModalOpen(true)}
                    className="mt-2"
                  >
                    Extract Symbols
                  </Button>
                </div>
              ) : filteredSymbols.length === 0 ? (
                <div className="text-center py-8">
                  <Filter className="h-8 w-8 mx-auto text-neutral-300" />
                  <p className="mt-2 text-neutral-500">No symbols match your filter criteria</p>
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {filteredSymbols.map((symbol) => (
                      <div 
                        key={symbol.id} 
                        className="aspect-square border border-neutral-200 rounded-md bg-neutral-50 flex items-center justify-center relative hover:border-primary cursor-pointer group"
                      >
                        {/* Actual symbol would be displayed here, using a placeholder for now */}
                        <div className="w-2/3 h-2/3 flex items-center justify-center text-neutral-800">
                          {/* This would be the actual symbol image in implementation */}
                          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d={[
                              "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
                              "M18 4h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1",
                              "M12 7v4",
                              "M10 9h4",
                              "M12 12h.01",
                              "M12 2a8 8 0 0 0-8 8v12",
                              "M5 12h14",
                              "M12 2a8 8 0 0 1 8 8"
                            ][symbol.id % 8]}></path>
                          </svg>
                        </div>
                        
                        {/* Category label */}
                        {symbol.category && (
                          <div className="absolute top-0 right-0 p-0.5">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          </div>
                        )}
                        
                        {/* Hover controls */}
                        <div className="absolute inset-0 bg-primary bg-opacity-80 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1">
                            <button className="p-1 bg-white rounded-full text-primary hover:bg-neutral-100">
                              <Tag className="h-3 w-3" />
                            </button>
                            <button className="p-1 bg-white rounded-full text-primary hover:bg-neutral-100">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination or load more would go here */}
                  {filteredSymbols.length < symbols.length && (
                    <div className="text-center mt-4">
                      <Button variant="outline">
                        Load More ({symbols.length - filteredSymbols.length} remaining)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
              <CardDescription>
                Apply actions to multiple symbols at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Select Symbols</Label>
                  <Select defaultValue="none">
                    <SelectTrigger>
                      <SelectValue placeholder="Select symbols" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      <SelectItem value="similar">Similar to Selected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Assign Category</Label>
                  <Select defaultValue="">
                    <SelectTrigger>
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select category</SelectItem>
                      <SelectItem value="character">Character</SelectItem>
                      <SelectItem value="diagram">Diagram</SelectItem>
                      <SelectItem value="plant">Plant</SelectItem>
                      <SelectItem value="astronomical">Astronomical</SelectItem>
                      <SelectItem value="decorative">Decorative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button disabled={symbols.length === 0} className="w-full">
                    Apply to Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Symbol Position Viewer */}
          <Card>
            <CardHeader>
              <CardTitle>Symbol Positioning</CardTitle>
              <CardDescription>
                Visualize the position of extracted symbols on the manuscript page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedPageId ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">Select a page to view symbol positions</p>
                </div>
              ) : symbolsLoading ? (
                <div className="text-center py-8">
                  <Puzzle className="h-8 w-8 mx-auto text-neutral-300 animate-pulse" />
                  <p className="mt-2 text-neutral-500">Loading symbols...</p>
                </div>
              ) : symbols.length === 0 ? (
                <div className="text-center py-8">
                  <Puzzle className="h-8 w-8 mx-auto text-neutral-300" />
                  <p className="mt-2 text-neutral-500">No symbols extracted yet</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setExtractionModalOpen(true)}
                    className="mt-2"
                  >
                    Extract Symbols
                  </Button>
                </div>
              ) : (
                <SymbolPositionViewer
                  pageId={selectedPageId}
                  folioNumber={page?.folioNumber || ""}
                  symbols={symbols}
                  imageUrl={page?.imageUrl || ""}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                  Symbol Categories
                </CardTitle>
                <CardDescription>
                  Distribution of symbols by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categories}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1a5276">
                        {categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ListFilter className="mr-2 h-5 w-5 text-primary" />
                  Symbol Frequency
                </CardTitle>
                <CardDescription>
                  Most common symbols in the manuscript
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Symbol A', value: 42 },
                          { name: 'Symbol B', value: 28 },
                          { name: 'Symbol C', value: 23 },
                          { name: 'Symbol D', value: 17 },
                          { name: 'Symbol E', value: 15 },
                          { name: 'Others', value: 44 }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SlidersHorizontal className="mr-2 h-5 w-5 text-primary" />
                  Symbol Distribution Across Sections
                </CardTitle>
                <CardDescription>
                  How symbols are distributed across manuscript sections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { name: 'Herbal', character: 120, diagram: 45, plant: 78, astronomical: 23, decorative: 34 },
                        { name: 'Astronomical', character: 85, diagram: 30, plant: 45, astronomical: 68, decorative: 21 },
                        { name: 'Biological', character: 93, diagram: 42, plant: 65, astronomical: 32, decorative: 28 },
                        { name: 'Cosmological', character: 68, diagram: 38, plant: 32, astronomical: 56, decorative: 19 },
                        { name: 'Pharmaceutical', character: 105, diagram: 40, plant: 59, astronomical: 29, decorative: 31 },
                        { name: 'Recipes', character: 72, diagram: 22, plant: 43, astronomical: 19, decorative: 25 },
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="character" stroke="#1a5276" name="Characters" />
                      <Line type="monotone" dataKey="diagram" stroke="#d4ac0d" name="Diagrams" />
                      <Line type="monotone" dataKey="plant" stroke="#28b463" name="Plants" />
                      <Line type="monotone" dataKey="astronomical" stroke="#2e86c1" name="Astronomical" />
                      <Line type="monotone" dataKey="decorative" stroke="#ca6f1e" name="Decorative" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Symbol Extraction Modal */}
      {extractionModalOpen && selectedPageId && (
        <SymbolExtraction 
          pageId={selectedPageId}
          folioNumber={page?.folioNumber}
          onClose={() => setExtractionModalOpen(false)}
        />
      )}
    </div>
  );
}

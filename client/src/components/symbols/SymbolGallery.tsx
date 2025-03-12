import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SymbolPositionViewer from './SymbolPositionViewer';
import {
  Search,
  Filter,
  ArrowLeft,
  Puzzle,
  Grid,
  LayoutGrid,
  Tag,
  LayoutList
} from 'lucide-react';

interface SymbolGalleryProps {
  pageId: number;
  onBack?: () => void;
}

const SymbolGallery: React.FC<SymbolGalleryProps> = ({ pageId, onBack }) => {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSymbol, setSelectedSymbol] = useState<number | null>(null);
  
  // Fetch page details
  const { data: pageData, isLoading: pageLoading } = useQuery({
    queryKey: [`/api/pages/${pageId}`],
    enabled: !!pageId,
  });

  // Fetch symbols for the page
  const { data: symbolsData, isLoading: symbolsLoading } = useQuery({
    queryKey: [`/api/symbols/page/${pageId}`],
    enabled: !!pageId,
  });
  
  const page = pageData?.page;
  const symbols = symbolsData?.symbols || [];
  
  // Filter symbols based on search and category
  const filteredSymbols = symbols.filter(symbol => {
    // Apply category filter
    if (categoryFilter !== 'all' && symbol.category !== categoryFilter) {
      return false;
    }
    
    // Apply search term (searching in metadata)
    if (searchTerm && symbol.metadata) {
      const metadata = JSON.stringify(symbol.metadata).toLowerCase();
      return metadata.includes(searchTerm.toLowerCase());
    }
    
    return true;
  });
  
  // Get symbol categories dynamically
  const categories = Array.from(
    new Set(symbols.map(s => s.category || 'unknown'))
  );
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setLocation(`/manuscript?pageId=${pageId}`);
    }
  };
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold">
              Symbols {page && `for Page ${page.folioNumber}`}
            </h1>
            <p className="text-neutral-600">
              {symbolsLoading ? 'Loading symbols...' : 
                symbols.length === 0 ? 'No symbols extracted yet' : 
                `${symbols.length} symbols extracted, ${filteredSymbols.length} shown`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'map' ? 'default' : 'ghost'} 
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode('map')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Symbol Content */}
      {pageLoading || symbolsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      ) : symbols.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Puzzle className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Symbols Found</h3>
            <p className="text-neutral-600 mb-4">
              There are no symbols extracted yet for this page.
            </p>
            <Button onClick={() => setLocation(`/symbols?tab=extraction&pageId=${pageId}`)}>
              Start Symbol Extraction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredSymbols.map(symbol => (
                <Card 
                  key={symbol.id}
                  className={`cursor-pointer hover:ring-2 hover:ring-primary transition-all ${
                    selectedSymbol === symbol.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedSymbol(symbol.id === selectedSymbol ? null : symbol.id)}
                >
                  <CardContent className="p-3 text-center flex flex-col items-center">
                    <div className="aspect-square w-full bg-neutral-100 rounded-md flex items-center justify-center mb-2 relative overflow-hidden">
                      {/* Symbol Image */}
                      {symbol.image ? (
                        <img 
                          src={`/uploads/symbols/${symbol.image}`} 
                          alt={`Symbol ${symbol.id}`}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            // Fallback to a placeholder if image is not available
                            e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                          }}
                        />
                      ) : (
                        <Puzzle className="h-8 w-8 text-neutral-300" />
                      )}
                      
                      {/* Position Indicator */}
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                        {symbol.x},{symbol.y}
                      </div>
                    </div>
                    
                    <div className="w-full mt-auto">
                      <div className="font-medium text-sm truncate">Symbol #{symbol.id}</div>
                      <div className="flex justify-center mt-1">
                        {symbol.category ? (
                          <Badge variant="outline" className="text-xs">
                            {symbol.category}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-neutral-500">
                            uncategorized
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Position</th>
                      <th className="px-4 py-2 text-left">Size</th>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Frequency</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSymbols.map(symbol => (
                      <tr 
                        key={symbol.id} 
                        className={`border-b hover:bg-neutral-50 cursor-pointer ${
                          selectedSymbol === symbol.id ? 'bg-neutral-100' : ''
                        }`}
                        onClick={() => setSelectedSymbol(symbol.id === selectedSymbol ? null : symbol.id)}
                      >
                        <td className="px-4 py-2">{symbol.id}</td>
                        <td className="px-4 py-2">({symbol.x}, {symbol.y})</td>
                        <td className="px-4 py-2">{symbol.width}×{symbol.height}</td>
                        <td className="px-4 py-2">
                          {symbol.category ? (
                            <Badge variant="outline">{symbol.category}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-neutral-500">unknown</Badge>
                          )}
                        </td>
                        <td className="px-4 py-2">{symbol.frequency || 'N/A'}</td>
                        <td className="px-4 py-2">
                          <Button variant="ghost" size="sm">
                            <Tag className="h-3 w-3 mr-1" /> Categorize
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
          
          {/* Map View */}
          {viewMode === 'map' && page && (
            <Card>
              <CardContent className="p-4">
                <SymbolPositionViewer
                  pageId={pageId}
                  folioNumber={page.folioNumber}
                  symbols={filteredSymbols}
                  imageUrl={`/uploads/${page.filename}`}
                  pageWidth={800}
                  pageHeight={1200}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Symbol Details (when selected) */}
          {selectedSymbol && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Symbol Details</CardTitle>
                <CardDescription>
                  Information about Symbol #{selectedSymbol}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredSymbols.find(s => s.id === selectedSymbol) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-neutral-100 p-4 rounded-md flex items-center justify-center">
                      {/* This would show the actual symbol image in a real implementation */}
                      <div className="w-32 h-32 flex items-center justify-center">
                        <Puzzle className="h-16 w-16 text-neutral-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-2">Metadata</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-neutral-600">ID:</span>
                          <span>{selectedSymbol}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-neutral-600">Position:</span>
                          <span>({filteredSymbols.find(s => s.id === selectedSymbol)?.x}, {filteredSymbols.find(s => s.id === selectedSymbol)?.y})</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-neutral-600">Size:</span>
                          <span>{filteredSymbols.find(s => s.id === selectedSymbol)?.width}×{filteredSymbols.find(s => s.id === selectedSymbol)?.height}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-neutral-600">Category:</span>
                          <span>{filteredSymbols.find(s => s.id === selectedSymbol)?.category || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-neutral-600">Frequency:</span>
                          <span>{filteredSymbols.find(s => s.id === selectedSymbol)?.frequency || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-neutral-600">Extracted:</span>
                          <span>{new Date(filteredSymbols.find(s => s.id === selectedSymbol)?.extractedAt || Date.now()).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Tag className="h-4 w-4 mr-1" /> Edit Category
                        </Button>
                        <Button variant="outline" size="sm">
                          View Similar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SymbolGallery;
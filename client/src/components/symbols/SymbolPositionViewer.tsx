import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZoomIn, ZoomOut, Maximize2, Eye, EyeOff, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

interface SymbolPositionViewerProps {
  pageId: number;
  folioNumber: string;
  symbols: any[]; // Array of symbols
  pageWidth?: number;
  pageHeight?: number;
  imageUrl: string;
}

const SymbolPositionViewer: React.FC<SymbolPositionViewerProps> = ({
  pageId,
  folioNumber,
  symbols,
  pageWidth = 800,
  pageHeight = 1200,
  imageUrl
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSymbols, setShowSymbols] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<number | null>(null);
  const [hoverSymbol, setHoverSymbol] = useState<number | null>(null);
  const [colorBy, setColorBy] = useState<'category' | 'frequency'>('category');
  const [activeTab, setActiveTab] = useState('view');
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add categories or generate them from symbols
  const categories = Array.from(
    new Set(symbols.map(s => s.category || 'unknown'))
  );

  // Generate frequency ranges (low, medium, high) based on symbol frequencies
  const getFrequencyClass = (frequency: number) => {
    if (!frequency) return 'unknown';
    if (frequency <= 2) return 'rare';
    if (frequency <= 10) return 'uncommon';
    if (frequency <= 30) return 'common';
    return 'very-common';
  };
  
  // Color mapping for categories and frequencies
  const categoryColors: Record<string, string> = {
    'unknown': '#cccccc',
    'character': '#4285f4',
    'punctuation': '#34a853',
    'diagram': '#fbbc05',
    'decoration': '#ea4335',
    'plant': '#42f498',
    'astronomical': '#c679e3',
    'alchemical': '#f9a825'
  };
  
  const frequencyColors: Record<string, string> = {
    'unknown': '#cccccc',
    'rare': '#34a853',
    'uncommon': '#4285f4',
    'common': '#fbbc05',
    'very-common': '#ea4335'
  };
  
  // Get color for a symbol based on the selected attribute
  const getSymbolColor = (symbol: any) => {
    if (colorBy === 'category') {
      return categoryColors[symbol.category || 'unknown'] || '#cccccc';
    } else {
      return frequencyColors[getFrequencyClass(symbol.frequency)] || '#cccccc';
    }
  };
  
  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  
  const handleZoomReset = () => {
    setZoomLevel(1);
  };
  
  // Handle symbol hover and selection
  const handleSymbolHover = (symbolId: number | null) => {
    setHoverSymbol(symbolId);
  };
  
  const handleSymbolClick = (symbolId: number) => {
    setSelectedSymbol(symbolId === selectedSymbol ? null : symbolId);
  };

  // Prepare symbol metadata for display
  const getSymbolMetadata = (symbol: any) => {
    const metadata = symbol.metadata || {};
    return {
      position: `(${symbol.x}, ${symbol.y})`,
      size: `${symbol.width}x${symbol.height}`,
      category: symbol.category || 'Unknown',
      frequency: symbol.frequency || 'N/A',
      extractedAt: new Date(symbol.createdAt || Date.now()).toLocaleString(),
      ...metadata
    };
  };
  
  return (
    <div className="flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-2">
          <TabsList>
            <TabsTrigger value="view">Symbol Positions</TabsTrigger>
            <TabsTrigger value="data">Symbol Metadata</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSymbols(!showSymbols)}
                  >
                    {showSymbols ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showSymbols ? 'Hide Symbols' : 'Show Symbols'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLabels(!showLabels)}
                    disabled={!showSymbols}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showLabels ? 'Hide Labels' : 'Show Labels'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Zoom In
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Zoom Out
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomReset}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Reset Zoom
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <TabsContent value="view" className="m-0">
          <Card className="border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Symbol Positioning - Page {folioNumber}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="color-by" className="text-sm">Color by:</Label>
                  <Select 
                    value={colorBy} 
                    onValueChange={(val: any) => setColorBy(val)}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Select coloring" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="frequency">Frequency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                {symbols.length} symbols positioned on page {folioNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 relative overflow-hidden">
              <div 
                className="relative overflow-auto border-t" 
                style={{ 
                  height: '500px',
                  width: '100%'
                }}
                ref={containerRef}
              >
                <div
                  className="relative"
                  style={{
                    width: pageWidth * zoomLevel,
                    height: pageHeight * zoomLevel,
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top left'
                  }}
                >
                  {/* Page Background Image */}
                  <img 
                    src={imageUrl} 
                    alt={`Page ${folioNumber}`}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    style={{ opacity: 0.8 }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  
                  {/* Symbols */}
                  {showSymbols && symbols.map(symbol => (
                    <div
                      key={symbol.id}
                      className="absolute border-2 cursor-pointer transition-all duration-200"
                      style={{
                        left: symbol.x * zoomLevel,
                        top: symbol.y * zoomLevel,
                        width: symbol.width * zoomLevel,
                        height: symbol.height * zoomLevel,
                        borderColor: getSymbolColor(symbol),
                        backgroundColor: `${getSymbolColor(symbol)}33`,
                        zIndex: selectedSymbol === symbol.id || hoverSymbol === symbol.id ? 100 : 10,
                        transform: selectedSymbol === symbol.id || hoverSymbol === symbol.id ? 'scale(1.05)' : 'scale(1)'
                      }}
                      onMouseEnter={() => handleSymbolHover(symbol.id)}
                      onMouseLeave={() => handleSymbolHover(null)}
                      onClick={() => handleSymbolClick(symbol.id)}
                    >
                      {(showLabels || selectedSymbol === symbol.id || hoverSymbol === symbol.id) && (
                        <div 
                          className="absolute -top-5 left-0 text-xs font-bold px-1 rounded"
                          style={{ 
                            backgroundColor: getSymbolColor(symbol),
                            color: 'white',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {symbol.category || 'Unknown'} {symbol.frequency ? `(${symbol.frequency})` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Symbol Metadata</CardTitle>
              <CardDescription>
                Detailed information about extracted symbols
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-96">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-neutral-100">
                      <th className="border p-2 text-left">ID</th>
                      <th className="border p-2 text-left">Position</th>
                      <th className="border p-2 text-left">Size</th>
                      <th className="border p-2 text-left">Category</th>
                      <th className="border p-2 text-left">Frequency</th>
                      <th className="border p-2 text-left">Additional Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symbols.map(symbol => {
                      const metadata = getSymbolMetadata(symbol);
                      return (
                        <tr 
                          key={symbol.id}
                          className={`hover:bg-neutral-50 ${selectedSymbol === symbol.id ? 'bg-neutral-100' : ''}`}
                          onClick={() => handleSymbolClick(symbol.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="border p-2">{symbol.id}</td>
                          <td className="border p-2">{metadata.position}</td>
                          <td className="border p-2">{metadata.size}</td>
                          <td className="border p-2">
                            <span 
                              className="inline-block w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: getSymbolColor(symbol) }}
                            ></span>
                            {metadata.category}
                          </td>
                          <td className="border p-2">{metadata.frequency}</td>
                          <td className="border p-2 text-xs">
                            {Object.entries(metadata)
                              .filter(([key]) => !['position', 'size', 'category', 'frequency'].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="mb-1">
                                  <span className="font-semibold">{key}:</span> {String(value)}
                                </div>
                              ))
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Legend */}
      <div className="mt-4 pt-3 border-t">
        <div className="text-sm font-medium mb-2">
          {colorBy === 'category' ? 'Symbol Categories' : 'Symbol Frequency'}
        </div>
        <div className="flex flex-wrap gap-3">
          {colorBy === 'category' ? (
            Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-sm mr-1" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-xs">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </div>
            ))
          ) : (
            Object.entries(frequencyColors).map(([frequency, color]) => (
              <div key={frequency} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-sm mr-1" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-xs">{frequency.charAt(0).toUpperCase() + frequency.slice(1)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SymbolPositionViewer;
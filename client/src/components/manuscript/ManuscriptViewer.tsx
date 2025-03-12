import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Puzzle, Download, Share, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageInfo from './PageInfo';
import PageNavigation from './PageNavigation';
import SymbolExtraction from './SymbolExtraction';
import { useToast } from '@/hooks/use-toast';

interface ManuscriptViewerProps {
  initialPageId?: number;
  initialFolioNumber?: string;
}

const ManuscriptViewer: React.FC<ManuscriptViewerProps> = ({ 
  initialPageId,
  initialFolioNumber
}) => {
  const [currentPageId, setCurrentPageId] = useState<number | null>(initialPageId || null);
  const [extractionModalOpen, setExtractionModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<'original' | 'enhanced' | 'high-contrast'>('original');
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  // Fetch the initial page by folio number if provided
  useEffect(() => {
    if (initialFolioNumber && !initialPageId) {
      fetchPageByFolio(initialFolioNumber);
    }
  }, [initialFolioNumber]);

  // Fetch all manuscript pages for navigation
  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ['/api/pages'],
    retry: false,
  });

  // Fetch current page details
  const { data: pageData, isLoading: pageLoading } = useQuery({
    queryKey: [`/api/pages/${currentPageId}`],
    enabled: !!currentPageId,
    retry: false,
  });

  // Fetch symbols for the current page
  const { data: symbolsData } = useQuery({
    queryKey: [`/api/symbols/page/${currentPageId}`],
    enabled: !!currentPageId,
    retry: false,
  });

  const page = pageData?.page;
  const pages = pagesData?.pages || [];
  const symbols = symbolsData?.symbols || [];
  
  // Auto-select the first page when component loads if no page is selected
  useEffect(() => {
    if (!currentPageId && pages.length > 0) {
      // Find the page with folioNumber "1r" or just take the first page
      const firstPage = pages.find(p => p.folioNumber === "1r") || pages[0];
      setCurrentPageId(firstPage.id);
    }
  }, [currentPageId, pages]);

  // Navigate to adjacent pages
  const navigateToPreviousPage = () => {
    if (!pages.length || !currentPageId) return;
    
    const currentIndex = pages.findIndex(p => p.id === currentPageId);
    if (currentIndex > 0) {
      setCurrentPageId(pages[currentIndex - 1].id);
    }
  };

  const navigateToNextPage = () => {
    if (!pages.length || !currentPageId) return;
    
    const currentIndex = pages.findIndex(p => p.id === currentPageId);
    if (currentIndex < pages.length - 1) {
      setCurrentPageId(pages[currentIndex + 1].id);
    }
  };

  // Fetch page by folio number
  const fetchPageByFolio = async (folioNumber: string) => {
    try {
      const response = await fetch(`/api/pages/folio/${folioNumber}`);
      if (!response.ok) throw new Error('Page not found');
      
      const data = await response.json();
      setCurrentPageId(data.page.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load the requested page",
        variant: "destructive",
      });
    }
  };

  // Handle zoom controls
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const toggleFullscreen = () => {
    if (imageContainerRef.current) {
      if (!document.fullscreenElement) {
        imageContainerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Handle symbol extraction
  const handleExtractSymbols = () => {
    setExtractionModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Viewer Controls */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-3 mb-4 flex flex-wrap items-center justify-between gap-2">
        {/* Left Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-neutral-100 rounded-md">
            <button 
              className="p-2 text-neutral-700 hover:bg-neutral-200 rounded-l-md"
              onClick={navigateToPreviousPage}
              disabled={!currentPageId || pages.findIndex(p => p.id === currentPageId) === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              className="p-2 text-neutral-700 hover:bg-neutral-200 rounded-r-md"
              onClick={navigateToNextPage}
              disabled={!currentPageId || pages.findIndex(p => p.id === currentPageId) === pages.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <select 
            className="border border-neutral-300 rounded-md px-2 py-1 text-sm bg-white"
            value={currentPageId || ''}
            onChange={(e) => setCurrentPageId(parseInt(e.target.value))}
            disabled={pagesLoading}
          >
            {pagesLoading ? (
              <option>Loading pages...</option>
            ) : (
              pages.map(p => (
                <option key={p.id} value={p.id}>
                  Page {p.folioNumber}
                </option>
              ))
            )}
          </select>
        </div>
        
        {/* Center Page Info */}
        <div className="text-center flex-1 hidden md:block">
          {pageLoading ? (
            <Skeleton className="h-4 w-48 mx-auto" />
          ) : page ? (
            <span className="text-sm text-neutral-500">
              Viewing page {page.folioNumber} of {pages.length} • 
              {page.section ? ` ${page.section.charAt(0).toUpperCase() + page.section.slice(1)} Section` : ' Unknown Section'}
            </span>
          ) : (
            <span className="text-sm text-neutral-500">No page selected</span>
          )}
        </div>
        
        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-neutral-100 rounded-md">
            <button 
              className="p-2 text-neutral-700 hover:bg-neutral-200"
              onClick={zoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button 
              className="p-2 text-neutral-700 hover:bg-neutral-200"
              onClick={zoomIn}
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button 
              className="p-2 text-neutral-700 hover:bg-neutral-200"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
          
          <select 
            className="border border-neutral-300 rounded-md px-2 py-1 text-sm bg-white"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
          >
            <option value="original">Original</option>
            <option value="enhanced">Enhanced</option>
            <option value="high-contrast">High Contrast</option>
          </select>
          
          <button 
            className="p-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center"
            onClick={handleExtractSymbols}
            disabled={!currentPageId}
          >
            <Puzzle className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Extract Symbols</span>
          </button>
        </div>
      </div>
      
      {/* Image Viewer and Side Panel */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* Main Viewer */}
        <div 
          ref={imageContainerRef}
          className="flex-1 bg-neutral-800 rounded-lg overflow-hidden flex items-center justify-center relative min-h-[400px]"
        >
          {pageLoading ? (
            <Skeleton className="w-3/4 h-3/4" />
          ) : page ? (
            <>
              {/* Manuscript Image */}
              <img 
                src={`/uploads/${page.filename}`}
                alt={`Voynich Manuscript Page ${page.folioNumber}`}
                className="max-w-full max-h-full object-contain transition-transform"
                style={{ transform: `scale(${zoomLevel})` }}
              />
              
              {/* Overlay Controls (shown on hover) */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex space-x-2">
                  <button className="p-2 bg-white/90 rounded-full text-neutral-800 hover:bg-white">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-white/90 rounded-full text-neutral-800 hover:bg-white">
                    <Share className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-white/90 rounded-full text-neutral-800 hover:bg-white">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Display Symbols */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ 
                  // We need this div to match the image size and position
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {page && (
                  <div 
                    className="relative"
                    style={{
                      // Set default dimensions if page width/height are not available
                      width: page.width ? `${page.width * zoomLevel}px` : '800px',
                      height: page.height ? `${page.height * zoomLevel}px` : '1200px',
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                  >
                    {symbols.map(symbol => {
                      const isHighlighted = false; // Will be implemented with state later
                      
                      // Scale the symbol dimensions according to the zoom level
                      const scaledX = symbol.x * zoomLevel;
                      const scaledY = symbol.y * zoomLevel;
                      const scaledWidth = symbol.width * zoomLevel;
                      const scaledHeight = symbol.height * zoomLevel;
                      
                      return (
                        <div 
                          key={symbol.id}
                          className={`absolute border-2 rounded-md ${isHighlighted 
                            ? 'border-primary bg-primary/20 z-20' 
                            : 'border-accent/60 hover:border-primary hover:bg-primary/10 z-10'}`}
                          style={{
                            top: `${scaledY}px`,
                            left: `${scaledX}px`,
                            width: `${scaledWidth}px`,
                            height: `${scaledHeight}px`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            pointerEvents: 'auto' // Enable mouse interactions
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/symbol-gallery?pageId=${currentPageId}&symbolId=${symbol.id}`;
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-white text-center p-8">
              <h3 className="text-xl font-semibold mb-2">No Page Selected</h3>
              <p>Select a page from the dropdown to view the manuscript.</p>
            </div>
          )}
        </div>
        
        {/* Side Panel with Page Info */}
        {currentPageId && page && (
          <PageInfo 
            page={page} 
            symbolCount={symbols.length} 
          />
        )}
      </div>
      
      {/* Page Navigation Footer */}
      {page && (
        <PageNavigation 
          pages={pages}
          currentPageId={currentPageId}
          onPageSelect={setCurrentPageId}
        />
      )}
      
      {/* Symbol Extraction Modal */}
      {extractionModalOpen && currentPageId && (
        <SymbolExtraction 
          pageId={currentPageId}
          folioNumber={page?.folioNumber}
          onClose={() => setExtractionModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ManuscriptViewer;

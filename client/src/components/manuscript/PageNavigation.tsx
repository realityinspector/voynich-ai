import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageNavigationProps {
  pages: any[];
  currentPageId: number | null;
  onPageSelect: (pageId: number) => void;
}

const PageNavigation: React.FC<PageNavigationProps> = ({ 
  pages, 
  currentPageId,
  onPageSelect
}) => {
  if (!pages.length || !currentPageId) return null;
  
  const currentIndex = pages.findIndex(p => p.id === currentPageId);
  if (currentIndex === -1) return null;
  
  // Get visible pages for thumbnail navigation (current +/- 2)
  const startIndex = Math.max(0, currentIndex - 2);
  const endIndex = Math.min(pages.length - 1, currentIndex + 2);
  const visiblePages = pages.slice(startIndex, endIndex + 1);
  
  const currentPage = pages[currentIndex];
  
  return (
    <footer className="bg-white border-t border-neutral-200 p-4 mt-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center">
        {/* Thumbnails Navigation */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {visiblePages.map(page => (
            <div 
              key={page.id}
              className={`flex-shrink-0 w-16 h-20 border rounded-md overflow-hidden cursor-pointer transition-colors ${
                page.id === currentPageId 
                  ? 'border-accent shadow-[0_0_0_2px_hsl(var(--accent))]' 
                  : 'border-neutral-300 hover:border-primary'
              }`}
              onClick={() => onPageSelect(page.id)}
            >
              <img 
                src={`/uploads/${page.filename}`}
                alt={`Page ${page.folioNumber} thumbnail`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        
        {/* Page Jump */}
        <div className="flex items-center space-x-3">
          <button 
            className="p-2 text-neutral-600 hover:text-neutral-800"
            onClick={() => {
              if (currentIndex > 0) {
                onPageSelect(pages[currentIndex - 1].id);
              }
            }}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-sm">
            <span className="font-medium">{currentPage.folioNumber}</span>
            <span className="text-neutral-600"> of {pages.length}</span>
          </div>
          
          <button 
            className="p-2 text-neutral-600 hover:text-neutral-800"
            onClick={() => {
              if (currentIndex < pages.length - 1) {
                onPageSelect(pages[currentIndex + 1].id);
              }
            }}
            disabled={currentIndex === pages.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default PageNavigation;

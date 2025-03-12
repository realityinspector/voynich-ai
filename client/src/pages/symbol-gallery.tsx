import { useLocation } from 'wouter';
import SymbolGallery from '@/components/symbols/SymbolGallery';

export default function SymbolGalleryPage() {
  const [location] = useLocation();
  
  // Extract the pageId from the URL query parameters
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const pageIdParam = searchParams.get('pageId');
  const pageId = pageIdParam ? parseInt(pageIdParam) : undefined;
  
  return (
    <div className="container mx-auto p-4">
      {pageId ? (
        <SymbolGallery pageId={pageId} />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">No Page Selected</h2>
          <p className="text-neutral-600">Select a manuscript page to view its symbols.</p>
        </div>
      )}
    </div>
  );
}
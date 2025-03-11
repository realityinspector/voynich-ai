import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import ManuscriptViewer from '@/components/manuscript/ManuscriptViewer';
import { useManuscript } from '@/hooks/useManuscript';
import { useToast } from '@/hooks/use-toast';

export default function Manuscript() {
  const [location] = useLocation();
  const { useManuscriptPages } = useManuscript();
  const { toast } = useToast();
  
  // Extract pageId from URL if present
  const [pageId, setPageId] = useState<number | undefined>(undefined);
  const [folioNumber, setFolioNumber] = useState<string | undefined>(undefined);

  // Fetch pages list to ensure we have data
  const { data: pagesData, isLoading, error } = useManuscriptPages();

  useEffect(() => {
    // Parse query parameters
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const pageIdParam = searchParams.get('pageId');
    const folioParam = searchParams.get('folio');
    
    if (pageIdParam) {
      setPageId(parseInt(pageIdParam));
    } else if (folioParam) {
      setFolioNumber(folioParam);
    } else if (pagesData?.pages && pagesData.pages.length > 0 && !isLoading) {
      // Default to first page if none specified and pages are loaded
      setPageId(pagesData.pages[0].id);
    }
  }, [location, pagesData, isLoading]);

  // Show error if pages loading fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading manuscript pages",
        description: "Unable to retrieve the manuscript pages. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="p-0 h-full flex flex-col">
      <ManuscriptViewer 
        initialPageId={pageId} 
        initialFolioNumber={folioNumber} 
      />
    </div>
  );
}

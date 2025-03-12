import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from './use-toast';

export function useManuscript() {
  const { toast } = useToast();

  // Fetch all manuscript pages with pagination
  const useManuscriptPages = (offset = 0, limit = 1000) => {
    // Increased default limit from 20 to 1000 to get all pages
    return useQuery({
      queryKey: [`/api/pages?offset=${offset}&limit=${limit}`],
      retry: false,
    });
  };

  // Fetch a single manuscript page by ID
  const useManuscriptPage = (pageId: number | undefined) => {
    return useQuery({
      queryKey: [`/api/pages/${pageId}`],
      enabled: !!pageId,
      retry: false,
    });
  };

  // Fetch a single manuscript page by folio number
  const useManuscriptPageByFolio = (folioNumber: string | undefined) => {
    return useQuery({
      queryKey: [`/api/pages/folio/${folioNumber}`],
      enabled: !!folioNumber,
      retry: false,
    });
  };

  // Update manuscript page metadata
  const updatePageMetadata = useMutation({
    mutationFn: async ({ pageId, data }: { pageId: number, data: any }) => {
      return apiRequest('PATCH', `/api/pages/${pageId}`, data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: [`/api/pages/${data.page.id}`] });
      toast({
        title: 'Page updated',
        description: 'Manuscript page metadata has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Create annotations for a page
  const createAnnotation = useMutation({
    mutationFn: async (annotationData: any) => {
      return apiRequest('POST', '/api/annotations', annotationData);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: [`/api/annotations/page/${data.annotation.pageId}`] });
      toast({
        title: 'Annotation created',
        description: 'Your annotation has been saved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Annotation failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Fetch annotations for a page
  const usePageAnnotations = (pageId: number | undefined) => {
    return useQuery({
      queryKey: [`/api/annotations/page/${pageId}`],
      enabled: !!pageId,
      retry: false,
    });
  };

  // Start extraction job
  const startExtractionJob = useMutation({
    mutationFn: async (jobData: any) => {
      return apiRequest('POST', '/api/extraction/start', jobData);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: 'Extraction job started',
        description: 'Symbol extraction job has been queued successfully',
      });
      return data.job;
    },
    onError: (error) => {
      toast({
        title: 'Extraction failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Fetch extraction jobs
  const useExtractionJobs = () => {
    return useQuery({
      queryKey: ['/api/extraction/jobs'],
      retry: false,
    });
  };

  // Fetch a specific extraction job
  const useExtractionJob = (jobId: number | undefined) => {
    return useQuery({
      queryKey: [`/api/extraction/job/${jobId}`],
      enabled: !!jobId,
      retry: false,
      refetchInterval: (data) => {
        // Poll more frequently if the job is still in progress
        return data?.job?.status === 'completed' ? false : 5000;
      },
    });
  };

  return {
    useManuscriptPages,
    useManuscriptPage,
    useManuscriptPageByFolio,
    updatePageMetadata,
    createAnnotation,
    usePageAnnotations,
    startExtractionJob,
    useExtractionJobs,
    useExtractionJob,
  };
}

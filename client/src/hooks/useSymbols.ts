import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from './use-toast';

export function useSymbols() {
  const { toast } = useToast();

  // Fetch symbols for a page
  const usePageSymbols = (pageId: number | undefined) => {
    return useQuery({
      queryKey: [`/api/symbols/page/${pageId}`],
      enabled: !!pageId,
      retry: false,
    });
  };

  // Fetch a single symbol by ID
  const useSymbol = (symbolId: number | undefined) => {
    return useQuery({
      queryKey: [`/api/symbols/${symbolId}`],
      enabled: !!symbolId,
      retry: false,
    });
  };

  // Update symbol metadata (categories, etc.)
  const updateSymbol = useMutation({
    mutationFn: async ({ symbolId, data }: { symbolId: number, data: any }) => {
      return apiRequest('PATCH', `/api/symbols/${symbolId}`, data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: [`/api/symbols/${data.symbol.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/symbols/page/${data.symbol.pageId}`] });
      toast({
        title: 'Symbol updated',
        description: 'Symbol metadata has been updated successfully',
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

  // Categorize multiple symbols at once
  const categorizeSymbols = useMutation({
    mutationFn: async ({ symbolIds, category }: { symbolIds: number[], category: string }) => {
      return apiRequest('POST', '/api/symbols/categorize', { symbolIds, category });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      // Invalidate queries for each affected page
      const pageIds = new Set(data.symbols.map((s: any) => s.pageId));
      pageIds.forEach(pageId => {
        queryClient.invalidateQueries({ queryKey: [`/api/symbols/page/${pageId}`] });
      });
      
      toast({
        title: 'Symbols categorized',
        description: `${data.symbols.length} symbols have been categorized successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Categorization failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Get symbol frequency data across the manuscript
  const useSymbolFrequencies = () => {
    return useQuery({
      queryKey: ['/api/symbols/frequencies'],
      retry: false,
    });
  };

  // Get symbol distribution by category
  const useSymbolDistribution = () => {
    return useQuery({
      queryKey: ['/api/symbols/distribution'],
      retry: false,
    });
  };

  // Get similar symbols for a given symbol
  const useSimilarSymbols = (symbolId: number | undefined) => {
    return useQuery({
      queryKey: [`/api/symbols/${symbolId}/similar`],
      enabled: !!symbolId,
      retry: false,
    });
  };

  return {
    usePageSymbols,
    useSymbol,
    updateSymbol,
    categorizeSymbols,
    useSymbolFrequencies,
    useSymbolDistribution,
    useSimilarSymbols,
  };
}

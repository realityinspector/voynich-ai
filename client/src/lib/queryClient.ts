import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Function to get base API URL - handles production vs. development environments
export function getBaseApiUrl(): string {
  // For client-side code
  if (typeof window !== 'undefined') {
    // Check if we're on the actual production domain
    if (window.location.hostname === 'voynichapi.com') {
      return 'https://voynich-ai-production.up.railway.app';
    }
    
    // For other environments, use relative URLs (works with Railway's domain)
    return '';
  }
  
  // For server-side code, default to empty (relative URLs)
  return '';
}

// Helper to construct API URLs
export function buildApiUrl(path: string): string {
  const baseUrl = getBaseApiUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

// Function to fetch API configuration from the server
export async function fetchApiConfig() {
  try {
    const response = await fetch(buildApiUrl('/api/config'));
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching API config:', error);
    return { STRIPE_PUBLIC_KEY: '' };
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const apiUrl = buildApiUrl(url);
  console.log(`API Request: ${method} ${apiUrl}`);
  
  const res = await fetch(apiUrl, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    // Clone the response before reading the body to avoid "body already read" errors
    const resClone = res.clone();
    console.error(`API Error: ${res.status} - ${await resClone.text().then(text => text.substring(0, 100))}`);
    await throwIfResNotOk(res.clone());
  } else {
    console.log(`API Success: ${method} ${apiUrl}`);
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const apiUrl = buildApiUrl(queryKey[0] as string);
    console.log(`Query request: ${apiUrl}`);
    
    const res = await fetch(apiUrl, {
      credentials: "include",
    });

    if (res.status === 401) {
      console.warn(`Auth 401 error for ${apiUrl}`);
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }
    
    if (!res.ok) {
      // Clone the response before reading the body
      const resClone = res.clone();
      console.error(`Query error: ${res.status} - ${await resClone.text().catch(() => "Error reading response").then(text => text.substring(0, 100))}`);
    } else {
      console.log(`Query success: ${apiUrl}`);
    }

    await throwIfResNotOk(res.clone());
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

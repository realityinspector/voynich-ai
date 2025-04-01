import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Function to fetch API configuration from the server
export async function fetchApiConfig() {
  try {
    const response = await fetch('/api/config');
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
  console.log(`API Request: ${method} ${url}`);
  
  const res = await fetch(url, {
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
    console.log(`API Success: ${method} ${url}`);
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Query request: ${queryKey[0]}`);
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (res.status === 401) {
      console.warn(`Auth 401 error for ${queryKey[0]}`);
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }
    
    if (!res.ok) {
      // Clone the response before reading the body
      const resClone = res.clone();
      console.error(`Query error: ${res.status} - ${await resClone.text().catch(() => "Error reading response").then(text => text.substring(0, 100))}`);
    } else {
      console.log(`Query success: ${queryKey[0]}`);
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

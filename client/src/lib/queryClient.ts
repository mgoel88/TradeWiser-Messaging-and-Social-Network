import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string | RequestInfo,
  url?: string | RequestInit,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Handle the case where method is a URL string and url is options
    if (typeof method === 'string' && typeof url === 'string') {
      // Traditional usage - method, url, data
      const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      
      await throwIfResNotOk(res);
      return res;
    } else if (typeof method === 'string' && typeof url === 'object') {
      // Alternative usage - url, options
      const finalUrl = method;
      const options = url;
      
      const res = await fetch(finalUrl, {
        ...options,
        headers: data ? { 
          ...options.headers,
          "Content-Type": "application/json" 
        } : options.headers,
        credentials: "include",
      });
      
      await throwIfResNotOk(res);
      return res;
    } else {
      // Direct fetch call
      const res = await fetch(method as RequestInfo, url as RequestInit);
      await throwIfResNotOk(res);
      return res;
    }
  } catch (error) {
    console.error(`API request error (${typeof method === 'string' ? method : 'fetch'} ${typeof url === 'string' ? url : '[object]'}):`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
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

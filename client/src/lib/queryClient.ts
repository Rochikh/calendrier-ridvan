import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  console.log(`🔄 API Request: ${method} ${url}`, data ? data : '(no data)');
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const options: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: "no-store" // Désactiver le cache pour toujours récupérer les données fraîches
  };
  
  console.log('With fetch options:', { 
    method: options.method,
    headers: options.headers,
    hasBody: !!options.body,
    credentials: options.credentials
  });
  
  try {
    const res = await fetch(url, options);
    console.log(`📥 API Response: ${method} ${url} - Status: ${res.status}`);
    
    if (!res.ok) {
      console.error(`❌ API Error: ${method} ${url} - Status: ${res.status}`);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error(`${res.status}: ${errorText}`);
    }
    
    return res;
  } catch (error) {
    console.error(`❌ API Request failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`🔍 Query: ${queryKey[0]}`);
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        // Cache: 'no-store' empêche le cache des requêtes, utile pour le débogage
        cache: 'no-store'
      });
      
      console.log(`📥 Query Response: ${queryKey[0]} - Status: ${res.status}`);
      
      // Gérer les réponses 401 Unauthorized selon la stratégie définie
      if (res.status === 401) {
        console.log(`🔒 Unauthorized (401) response for ${queryKey[0]}`);
        if (unauthorizedBehavior === "returnNull") {
          console.log('Returning null as configured by on401="returnNull"');
          return null;
        } else {
          console.error('Throwing error as configured by on401="throw"');
        }
      }
      
      if (!res.ok) {
        console.error(`❌ Query error: ${queryKey[0]} - Status ${res.status}`);
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`❌ Query failed: ${queryKey[0]}`, error);
      throw error;
    }
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

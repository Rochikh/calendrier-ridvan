import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Secret d'administration - DOIT correspondre à celui du serveur
// En production, ce devrait être une variable d'environnement
const ADMIN_SECRET = 'qP7XbCdR8sT9vZ2a3wF5gH6jK1mN4pL';

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`🔄 API Request: ${method} ${url}`, data ? data : '(no data)');
  
  // Préparer les en-têtes
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Ajouter le secret d'administration pour les requêtes de modification
  // Exclure les requêtes GET et les requêtes d'authentification
  if (method !== 'GET' && !url.includes('/api/login') && !url.includes('/api/logout')) {
    // Utiliser le header X-Admin-Secret pour la sécurité
    headers["X-Admin-Secret"] = ADMIN_SECRET;
    console.log('🔑 Adding X-Admin-Secret header for administrative access');
    
    // Garder aussi la compatibilité avec le système d'API key pour le développement
    const apiKey = localStorage.getItem('auth_api_key');
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      console.log('🔑 Also adding API key in Authorization header (for dev mode)');
    }
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
    hasAdminSecret: !!headers["X-Admin-Secret"], 
    hasApiKey: !!headers.Authorization,
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
    
    // Récupérer l'API key du localStorage si disponible
    const apiKey = localStorage.getItem('auth_api_key');
    
    try {
      // Créer des en-têtes avec l'API key si disponible
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        console.log('🔑 Using API key in Authorization header for query');
      }
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers,
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

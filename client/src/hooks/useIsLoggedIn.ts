import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthStatus } from "@/lib/api";

interface AuthStatus {
  isLoggedIn: boolean;
}

export default function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const { data, isLoading, error, refetch } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    queryFn: async () => {
      return await getAuthStatus();
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchIntervalInBackground: false
  });
  
  useEffect(() => {
    if (data) {
      setIsLoggedIn(data.isLoggedIn);
    }
  }, [data]);
  
  return { isLoggedIn, isLoading, error, refetch };
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface AuthStatus {
  isLoggedIn: boolean;
}

export default function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const { data, isLoading, error } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchIntervalInBackground: false
  });
  
  useEffect(() => {
    if (data) {
      setIsLoggedIn(data.isLoggedIn);
    }
  }, [data]);
  
  return { isLoggedIn, isLoading, error };
}

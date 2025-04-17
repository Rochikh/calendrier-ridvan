import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getAuthStatus } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use TanStack Query to manage auth status
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      try {
        const status = await getAuthStatus();
        return status;
      } catch (error) {
        console.error('Error fetching auth status:', error);
        return { isLoggedIn: false };
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Every 30 seconds
  });
  
  // Update isLoggedIn state whenever the query data changes
  useEffect(() => {
    if (data) {
      setIsLoggedIn(data.isLoggedIn);
    }
  }, [data]);
  
  const login = async (password: string): Promise<boolean> => {
    try {
      await apiLogin(password);
      await refetch(); // Immediately refetch auth status
      
      // Also invalidate the query to ensure fresh data across the app
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
      
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté en tant qu'administrateur",
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Échec de la connexion",
        description: "Mot de passe administrateur invalide",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      await apiLogout();
      await refetch(); // Immediately refetch auth status
      
      // Also invalidate the query to ensure fresh data across the app
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
      
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté"
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Échec de la déconnexion",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };
  
  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
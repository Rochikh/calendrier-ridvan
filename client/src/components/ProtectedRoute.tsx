import { ReactNode } from 'react';
import { Route, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ path, component: Component }) => {
  const { isLoggedIn, isLoading } = useAuth();
  const [, navigate] = useLocation();

  return (
    <Route
      path={path}
      component={() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
            </div>
          );
        }

        if (!isLoggedIn) {
          // Redirect to login page if not authenticated
          navigate('/login');
          return null;
        }

        return <Component />;
      }}
    />
  );
};
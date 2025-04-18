import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SimpleAdmin from "@/pages/SimpleAdmin";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";

function RouterWithPathnameUpdater() {
  const [location, setLocation] = useLocation();

  // Effect to update title based on current route
  useEffect(() => {
    let title = "Riḍván Calendar";
    
    if (location.startsWith("/admin")) {
      title = "Admin Dashboard | Riḍván Calendar";
    } else if (location.startsWith("/login")) {
      title = "Admin Login | Riḍván Calendar";
    }
    
    document.title = title;
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={SimpleAdmin} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterWithPathnameUpdater />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

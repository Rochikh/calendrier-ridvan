import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "@shared/schema";
import AdminContentForm from "@/components/AdminContentForm";
import AdminSettingsForm from "@/components/AdminSettingsForm";
import AdminContentTable from "@/components/AdminContentTable";

// Mot de passe codé en dur (normalement, cela devrait être stocké de manière sécurisée)
const ADMIN_PASSWORD = "9999";

export default function SimpleAdmin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>("settings");

  // Check for authentication in localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("ridvan_admin_auth");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Handle login
  const handleLogin = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        localStorage.setItem("ridvan_admin_auth", "true");
        toast({
          title: "Connexion réussie",
          description: "Bienvenue dans l'interface d'administration",
        });
      } else {
        toast({
          title: "Échec de la connexion",
          description: "Mot de passe incorrect",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 500);
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("ridvan_admin_auth");
    navigate("/");
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté",
    });
  };

  // Handle selecting a day for editing
  const handleEditContent = (day: number) => {
    setSelectedDay(day);
    setActiveTab("content");
    // Faire défiler jusqu'au formulaire après un court délai
    setTimeout(() => {
      document.getElementById("content-form")?.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
    }, 100);
  };

  // Loading state
  if (isAuthenticated && isLoadingSettings) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement en cours...</p>
        </div>
      </div>
    );
  }

  // Login page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-80">
        <div className="absolute inset-0 -z-10 bg-cover bg-center" 
          style={{ 
            backgroundImage: `url(https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=2048&q=80)`,
            filter: 'blur(4px)'
          }} 
        />
        
        <Card className="max-w-md w-full mx-4 bg-white rounded-lg shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-2xl font-[Cinzel] text-center text-[#1E3A8A] mb-6">
              Administration
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-gray-700 font-[Inter] block">Mot de passe</label>
                <Input
                  type="password"
                  placeholder="Entrez le mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin();
                    }
                  }}
                />
              </div>
              
              <Button 
                onClick={handleLogin}
                className="w-full bg-[#1E3A8A] text-white font-[Inter] font-medium py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Connexion en cours..." : "Connexion"}
              </Button>
              
              <div className="mt-4 text-center">
                <a 
                  href="/" 
                  className="text-sm text-gray-600 hover:text-[#1E3A8A] transition-colors font-[Inter]"
                >
                  Retour au Calendrier
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <h1 className="text-xl sm:text-2xl font-[Cinzel] text-[#1E3A8A] text-center sm:text-left">Riḍván Calendar Admin</h1>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-[#1E3A8A] transition-colors font-[Inter]">Voir Calendrier</a>
              <button 
                className="bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-red-700 transition-colors font-[Inter] text-sm sm:text-base"
                onClick={handleLogout}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs 
          defaultValue="settings" 
          className="w-full mb-4 sm:mb-8"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="settings" className="flex-1 sm:flex-initial">Paramètres</TabsTrigger>
            <TabsTrigger value="content" className="flex-1 sm:flex-initial">Contenu</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            {/* Settings Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-[Cinzel] text-[#1E3A8A] mb-6">Paramètres Visuels</h2>
              <div className="mx-auto w-full sm:max-w-2xl">
                <AdminSettingsForm settings={settings} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content">
            <div className="grid grid-cols-1 gap-4 sm:gap-8">
              {/* Content Table */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-[Cinzel] text-[#1E3A8A] mb-6">Liste des Contenus</h2>
                <AdminContentTable 
                  totalDays={settings?.totalDays || 19} 
                  onEditContent={handleEditContent}
                />
              </div>
              
              {/* Content Management Form */}
              <div id="content-form" className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-[Cinzel] text-[#1E3A8A] mb-6">Modifier le Contenu - Jour {selectedDay}</h2>
                <AdminContentForm 
                  totalDays={settings?.totalDays || 19} 
                  initialDay={selectedDay}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
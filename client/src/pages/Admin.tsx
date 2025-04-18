import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AdminContentForm from "@/components/AdminContentForm";
import AdminSettingsForm from "@/components/AdminSettingsForm";
import AdminContentTable from "@/components/AdminContentTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  // Par défaut, on affiche l'onglet des paramètres
  const [activeTab, setActiveTab] = useState<string>("settings");

  // Fetch settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Redirection directe avec window.location pour forcer un rafraîchissement complet
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
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
  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement en cours...</p>
        </div>
      </div>
    );
  }

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
            <TabsTrigger value="content" className="flex-1 sm:flex-initial">Contenu</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 sm:flex-initial">Paramètres</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content">
            <div className="grid grid-cols-1 gap-4 sm:gap-8">
              {/* Content Table */}
              <AdminContentTable 
                totalDays={settings?.totalDays || 19} 
                onEditContent={handleEditContent}
              />
              
              {/* Content Management Form */}
              <div id="content-form">
                <AdminContentForm 
                  totalDays={settings?.totalDays || 19} 
                  initialDay={selectedDay}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            {/* Settings Form */}
            <div className="mx-auto w-full sm:max-w-2xl">
              <AdminSettingsForm settings={settings} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AdminSettingsForm from "@/components/AdminSettingsForm";

export default function AdminSettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { logout, isLoggedIn, isLoading: isAuthLoading } = useAuth();

  // Fetch settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
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

  // Loading state
  if (isLoadingSettings || isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement en cours...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in, with direct window.location redirect which is more reliable
  if (!isLoggedIn) {
    window.location.href = "/login";
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Redirection vers la page de connexion...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <h1 className="text-xl sm:text-2xl font-[Cinzel] text-[#1E3A8A] text-center sm:text-left">Paramètres du Calendrier Riḍván</h1>
            <div className="flex items-center space-x-4">
              <a href="/admin" className="text-gray-600 hover:text-[#1E3A8A] transition-colors font-[Inter]">Gestion de Contenu</a>
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-[Cinzel] text-[#1E3A8A] mb-6">Paramètres Visuels</h2>
          <div className="mx-auto w-full sm:max-w-2xl">
            <AdminSettingsForm settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
}
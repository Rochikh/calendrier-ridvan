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

  // Fetch settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle selecting a day for editing
  const handleEditContent = (day: number) => {
    setSelectedDay(day);
    // Faire défiler jusqu'au formulaire
    document.getElementById("content-form")?.scrollIntoView({ 
      behavior: "smooth", 
      block: "start" 
    });
  };

  if (isLoadingSettings) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-[Cinzel] text-[#1E3A8A]">Riḍván Calendar Admin</h1>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-[#1E3A8A] transition-colors font-[Inter]">View Calendar</a>
              <button 
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-[Inter]"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="content" className="w-full mb-8">
          <TabsList>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content">
            <div className="grid grid-cols-1 gap-8">
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
            <div className="max-w-2xl mx-auto">
              <AdminSettingsForm settings={settings} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

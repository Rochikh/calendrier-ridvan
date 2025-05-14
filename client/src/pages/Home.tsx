import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import StarGrid from "@/components/StarGrid";
import ContentModal from "@/components/ContentModal";
import { Settings, Content } from "@shared/schema";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [currentContent, setCurrentContent] = useState<Content | null>(null);

  // Fetch settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  // Fetch content for selected day
  const { data: content, isLoading: isLoadingContent, error: contentError } = useQuery<Content[]>({
    queryKey: [`/api/content/${currentDay}`],
    enabled: !!currentDay,
    retry: false, // Ne pas réessayer en cas d'erreur 404
    staleTime: 0, // Toujours refétcher les données
    throwOnError: false // Ne pas lancer d'exception pour les erreurs 404
  });

  // Update current content when content is loaded
  useEffect(() => {
    console.log("Content query for day", currentDay, ":", { content, error: contentError, isLoading: isLoadingContent });
    
    // Si aucun jour n'est sélectionné, on ne fait rien
    if (!currentDay) return;
    
    // Si les données sont en cours de chargement, on attend
    if (isLoadingContent) return;
    
    // Une fois le chargement terminé, on traite les résultats
    if (contentError) {
      console.log(`Error loading content for day ${currentDay}:`, contentError);
      // Réinitialiser le contenu actuel en cas d'erreur (404)
      setCurrentContent(null);
      // Ouvrir la modale même s'il y a erreur, pour afficher le message "Aucun contenu"
      setIsModalOpen(true);
      return;
    }
    
    if (content && content.length > 0) {
      console.log("Content successfully loaded for day", currentDay, ":", content);
      // Prendre le premier élément du tableau car getContent renvoie un tableau
      const contentItem = content[0]; 
      console.log("Using content item:", contentItem);
      setCurrentContent(contentItem);
      // Ouvrir la modale avec le contenu
      setIsModalOpen(true);
    } else {
      // Pas de contenu trouvé
      console.log(`No content found for day ${currentDay}`);
      setCurrentContent(null);
      // Ouvrir la modale avec le message "Aucun contenu"
      setIsModalOpen(true);
    }
  }, [content, contentError, isLoadingContent, currentDay]);

  // Handle star click
  const handleStarClick = (day: number) => {
    // D'abord on définit le jour, ce qui va déclencher le chargement des données
    setCurrentDay(day);
    
    // Afficher directement un indicateur de chargement si le contenu n'est pas déjà chargé
    if (isLoadingContent) {
      setIsModalOpen(true);
    }
    
    // Le reste du processus se fait dans l'effet useEffect
    // La modale avec le contenu réel s'affichera une fois les données chargées
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentDay(null);
  };

  // Generate random stars for background effect
  const [stars, setStars] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const generateStars = () => {
      const starCount = 100;
      const newStars = [];

      for (let i = 0; i < starCount; i++) {
        const size = Math.random() * 2;
        const opacity = Math.random() * 0.7 + 0.3;
        const duration = Math.random() * 3 + 2;
        const left = `${Math.random() * 100}%`;
        const top = `${Math.random() * 100}%`;

        newStars.push(
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left,
              top,
              opacity,
              animation: `twinkle ${duration}s infinite alternate`
            }}
          />
        );
      }

      setStars(newStars);
    };

    generateStars();
  }, []);

  // Default values if settings are not loaded yet
  const {
    appTitle = "Riḍván",
    appDescription = "The Festival of Paradise",
    titleColor = "#1E3A8A",
    starColor = "#FCD34D",
    starBorderColor = "#F59E0B",
    backgroundImage = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=2048&q=80",
    totalDays = 19
  } = settings || {};

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background with cosmic imagery - Affichage conditionnel pendant le chargement */}
      {isLoadingSettings ? (
        // Background de chargement simple
        <div className="fixed inset-0 bg-black bg-opacity-90" />
      ) : (
        // Background avec l'image chargée depuis les paramètres
        <div 
          className="fixed inset-0 bg-cover bg-center bg-black" 
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      
      {/* Starry overlay - Affiché seulement une fois les paramètres chargés */}
      <div className="fixed inset-0 bg-black bg-opacity-50 overflow-hidden">
        <div className="absolute inset-0">
          {!isLoadingSettings && stars}
        </div>
      </div>
      
      {/* Content container */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen">
        {/* Header Section */}
        <header className="text-center py-8 md:py-12">
          {isLoadingSettings ? (
            // Afficher un placeholder pendant le chargement
            <div className="animate-pulse">
              <div className="h-16 md:h-20 bg-gray-700 rounded-lg w-3/4 mx-auto mb-3"></div>
              <div className="h-6 bg-gray-700 rounded w-1/2 mx-auto"></div>
            </div>
          ) : (
            // Afficher le titre et la description une fois chargés
            <>
              <h1 
                className="font-[Cinzel] text-5xl md:text-7xl font-bold tracking-wider"
                style={{ color: titleColor }}
              >
                {appTitle}
              </h1>
              <p className="text-white font-[Inter] text-lg mt-2 opacity-80">
                {appDescription}
              </p>
            </>
          )}
        </header>
        
        {/* Star Grid Section */}
        <main className="flex-1 container mx-auto px-4 py-8">
          {isLoadingSettings ? (
            // Afficher un indicateur de chargement pendant le chargement des paramètres
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
              <p className="text-white text-xl">Chargement du calendrier...</p>
            </div>
          ) : (
            // Afficher la grille d'étoiles uniquement lorsque les paramètres sont chargés
            <StarGrid 
              totalDays={totalDays} 
              starColor={starColor} 
              starBorderColor={starBorderColor} 
              onStarClick={handleStarClick} 
            />
          )}
        </main>
        
        {/* Footer with Admin Link */}
        <footer className="relative z-10 p-4 text-center">
          <a href="/admin" className="text-white opacity-60 hover:opacity-100 text-sm font-[Inter] transition-opacity duration-300">
            Administrator Access
          </a>
        </footer>
      </div>
      
      {/* Content Modal */}
      {isModalOpen && (
        currentContent ? (
          <ContentModal 
            isOpen={true}
            onClose={closeModal} 
            content={currentContent} 
            titleColor={titleColor}
          />
        ) : (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={closeModal}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 text-center">
              <h2 
                className="text-2xl font-[Cinzel] mb-4"
                style={{ color: titleColor }}
              >
                Jour {currentDay}
              </h2>
              
              {isLoadingContent ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">Chargement du contenu...</p>
                </div>
              ) : (
                <p className="text-gray-700 my-8">Aucun contenu n'est disponible pour ce jour.</p>
              )}
              
              <button 
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={closeModal}
              >
                Fermer
              </button>
            </div>
          </div>
        )
      )}

      {/* Add twinkle animation */}
      <style>{`
        @keyframes twinkle {
          0% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

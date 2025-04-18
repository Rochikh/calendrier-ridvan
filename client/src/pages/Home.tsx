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
  const { data: content, isLoading: isLoadingContent } = useQuery<Content[]>({
    queryKey: ["/api/content", currentDay],
    enabled: !!currentDay,
  });

  // Update current content when content is loaded
  useEffect(() => {
    if (content && content.length > 0) {
      console.log("Content loaded for day", currentDay, ":", content);
      // Prendre le premier élément du tableau car getContent renvoie un tableau
      const contentItem = content[0];
      console.log("Using content item:", contentItem);
      setCurrentContent(contentItem);
    }
  }, [content, currentDay]);

  // Handle star click
  const handleStarClick = (day: number) => {
    setCurrentDay(day);
    setIsModalOpen(true);
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
    titleColor = "#1E3A8A",
    starColor = "#FCD34D",
    starBorderColor = "#F59E0B",
    backgroundImage = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=2048&q=80",
    totalDays = 19
  } = settings || {};

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background with cosmic imagery */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-black" 
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Starry overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 overflow-hidden">
        <div className="absolute inset-0">
          {stars}
        </div>
      </div>
      
      {/* Content container */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen">
        {/* Header Section */}
        <header className="text-center py-8 md:py-12">
          <h1 
            className="font-[Cinzel] text-5xl md:text-7xl font-bold tracking-wider"
            style={{ color: titleColor }}
          >
            Riḍván
          </h1>
          <p className="text-white font-[Inter] text-lg mt-2 opacity-80">
            The Festival of Paradise
          </p>
        </header>
        
        {/* Star Grid Section */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <StarGrid 
            totalDays={totalDays} 
            starColor={starColor} 
            starBorderColor={starBorderColor} 
            onStarClick={handleStarClick} 
          />
        </main>
        
        {/* Footer with Admin Link */}
        <footer className="relative z-10 p-4 text-center">
          <Link href="/login" className="text-white opacity-60 hover:opacity-100 text-sm font-[Inter] transition-opacity duration-300">
            Administrator Access
          </Link>
        </footer>
      </div>
      
      {/* Content Modal */}
      {currentContent && (
        <ContentModal 
          isOpen={isModalOpen} 
          onClose={closeModal} 
          content={currentContent} 
          titleColor={titleColor}
        />
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

import { Content, ContentType } from "@shared/schema";
import { X } from "lucide-react";

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Content;
  titleColor: string;
}

export default function ContentModal({ isOpen, onClose, content, titleColor }: ContentModalProps) {
  // Fonction pour convertir une URL YouTube standard en URL d'intégration
  const getYouTubeEmbedUrl = (url: string): string => {
    // Cas 1: https://www.youtube.com/watch?v=VIDEO_ID
    // Cas 2: https://youtu.be/VIDEO_ID
    // Cas 3: https://www.youtube.com/embed/VIDEO_ID (déjà au format d'intégration)
    
    if (!url) return "";
    
    let videoId = "";
    
    try {
      if (url.includes("youtube.com/watch")) {
        // Extraire l'ID de la vidéo de l'URL YouTube standard
        const urlParams = new URL(url).searchParams;
        videoId = urlParams.get("v") || "";
      } else if (url.includes("youtu.be/")) {
        // Extraire l'ID de la vidéo d'une URL youtu.be/
        const parts = url.split("youtu.be/");
        videoId = parts[1] ? parts[1].split("?")[0] : "";
      } else if (url.includes("youtube.com/embed/")) {
        // Déjà au format d'intégration, on le renvoie tel quel
        return url;
      } else {
        // Format non reconnu, renvoyer une URL vide
        console.error("Format d'URL YouTube non reconnu:", url);
        return "";
      }
      
      // Construire l'URL d'intégration
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (error) {
      console.error("Erreur lors de la conversion de l'URL YouTube:", error);
      return "";
    }
  };
  if (!isOpen) return null;

  console.log("Rendering modal with content:", content);
  
  // Function to safely get content data
  const getContentData = () => {
    const contentData = content.content;
    
    console.log("Content type:", content.type);
    console.log("Original content data:", contentData);
    
    // Handle string content (might be a JSON string)
    if (typeof contentData === 'string') {
      try {
        return JSON.parse(contentData);
      } catch (e) {
        console.error("Failed to parse content data as JSON:", e);
        return { text: contentData };
      }
    }
    
    // Already an object, return as is
    return contentData || {};
  };

  // Render content based on type
  const renderContent = () => {
    const { type } = content;
    const data = getContentData();
    
    switch (type as ContentType) {
      case "text":
        return (
          <div className="content-text">
            <h3 className="text-xl font-[Lora] font-semibold mb-3">{content.title}</h3>
            <div className="font-[Lora] text-gray-700 space-y-4 whitespace-pre-line">
              {data.text}
            </div>
          </div>
        );

      case "image":
        return (
          <div className="content-image">
            <h3 className="text-lg sm:text-xl font-[Lora] font-semibold mb-2 sm:mb-3">{content.title}</h3>
            <img 
              src={data.imageUrl} 
              alt={data.imageCaption || content.title} 
              className="w-full rounded-lg shadow-md mb-3 max-h-[50vh] object-contain mx-auto"
            />
            {data.imageCaption && (
              <p className="font-[Lora] text-gray-700 text-sm sm:text-base">{data.imageCaption}</p>
            )}
          </div>
        );

      case "video":
        return (
          <div className="content-video">
            <h3 className="text-lg sm:text-xl font-[Lora] font-semibold mb-2 sm:mb-3">{content.title}</h3>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-md mb-3">
              {data.videoUrl && (
                <iframe
                  src={getYouTubeEmbedUrl(data.videoUrl)}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={content.title}
                  loading="lazy"
                ></iframe>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              <a href={data.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Voir la vidéo sur YouTube
              </a>
            </p>
          </div>
        );

      case "audio":
        return (
          <div className="content-audio">
            <h3 className="text-lg sm:text-xl font-[Lora] font-semibold mb-2 sm:mb-3">{content.title}</h3>
            {data.audioUrl && (
              <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                <audio 
                  className="w-full" 
                  controls 
                  src={data.audioUrl}
                  preload="metadata"
                >
                  Votre navigateur ne supporte pas l'élément audio.
                </audio>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  <a href={data.audioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Télécharger l'audio
                  </a>
                </p>
              </div>
            )}
          </div>
        );

      case "citation":
        return (
          <div className="content-citation">
            <h3 className="text-xl font-[Lora] font-semibold mb-3">{content.title}</h3>
            <blockquote className={`border-l-4 pl-4 py-2 italic font-[Lora] text-gray-700`} style={{ borderColor: titleColor }}>
              {data.citationText}
              {data.citationSource && (
                <footer className="text-gray-600 mt-2 not-italic">— {data.citationSource}</footer>
              )}
            </blockquote>
          </div>
        );

      case "link":
        return (
          <div className="content-link">
            <h3 className="text-xl font-[Lora] font-semibold mb-3">{content.title}</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-[Lora] text-blue-600 break-all">
                <a href={data.linkUrl} target="_blank" rel="noopener noreferrer">
                  {data.linkUrl}
                </a>
                {data.linkDescription && (
                  <span className="block mt-2 text-gray-600 text-sm">{data.linkDescription}</span>
                )}
              </p>
            </div>
          </div>
        );

      default:
        return <p>Content not available</p>;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm overflow-y-auto py-4 px-2"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-auto my-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 
            className="text-xl sm:text-2xl font-[Cinzel]"
            style={{ color: titleColor }}
          >
            Jour {content.day}
          </h2>
          <button 
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-4 sm:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
import { Content, ContentType } from "@shared/schema";
import { X } from "lucide-react";

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Content;
  titleColor: string;
}

export default function ContentModal({ isOpen, onClose, content, titleColor }: ContentModalProps) {
  if (!isOpen) return null;

  // Get content data based on type
  const renderContent = () => {
    const { type, content: contentData } = content;

    switch (type as ContentType) {
      case "text":
        return (
          <div className="content-text">
            <h3 className="text-xl font-[Lora] font-semibold mb-3">{content.title}</h3>
            <div className="font-[Lora] text-gray-700 space-y-4 whitespace-pre-line">
              {contentData.text}
            </div>
          </div>
        );

      case "image":
        return (
          <div className="content-image">
            <h3 className="text-xl font-[Lora] font-semibold mb-3">{content.title}</h3>
            <img 
              src={contentData.imageUrl} 
              alt={contentData.imageCaption || content.title} 
              className="w-full rounded-lg shadow-md mb-4 max-h-96 object-cover"
            />
            {contentData.imageCaption && (
              <p className="font-[Lora] text-gray-700">{contentData.imageCaption}</p>
            )}
          </div>
        );

      case "video":
        return (
          <div className="content-video">
            <h3 className="text-xl font-[Lora] font-semibold mb-3">{content.title}</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-[Lora] text-blue-600 break-all">
                <a href={contentData.videoUrl} target="_blank" rel="noopener noreferrer">
                  {contentData.videoUrl}
                </a>
                <span className="block mt-2 text-gray-600 text-sm">(Click to open video in a new tab)</span>
              </p>
            </div>
          </div>
        );

      case "audio":
        return (
          <div className="content-audio">
            <h3 className="text-xl font-[Lora] font-semibold mb-3">{content.title}</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-[Lora] text-blue-600 break-all">
                <a href={contentData.audioUrl} target="_blank" rel="noopener noreferrer">
                  {contentData.audioUrl}
                </a>
                <span className="block mt-2 text-gray-600 text-sm">(Click to open audio in a new tab)</span>
              </p>
            </div>
          </div>
        );

      case "citation":
        return (
          <div className="content-citation">
            <h3 className="text-xl font-[Lora] font-semibold mb-3">{content.title}</h3>
            <blockquote className={`border-l-4 pl-4 py-2 italic font-[Lora] text-gray-700`} style={{ borderColor: titleColor }}>
              {contentData.citationText}
              {contentData.citationSource && (
                <footer className="text-gray-600 mt-2 not-italic">— {contentData.citationSource}</footer>
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
                <a href={contentData.linkUrl} target="_blank" rel="noopener noreferrer">
                  {contentData.linkUrl}
                </a>
                {contentData.linkDescription && (
                  <span className="block mt-2 text-gray-600 text-sm">{contentData.linkDescription}</span>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 
            className="text-2xl font-[Cinzel]"
            style={{ color: titleColor }}
          >
            Day {content.day}
          </h2>
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onClose}
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

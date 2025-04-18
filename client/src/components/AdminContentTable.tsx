import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Content, ContentType } from "@shared/schema";
import { Edit, Trash2, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ContentModal from "@/components/ContentModal";

// Types for content data
interface TextContent { text: string; }
interface ImageContent { imageUrl: string; imageCaption?: string; }
interface VideoContent { videoUrl: string; }
interface AudioContent { audioUrl: string; }
interface CitationContent { citationText: string; citationSource?: string; }
interface LinkContent { linkUrl: string; linkDescription?: string; }

interface AdminContentTableProps {
  totalDays: number;
  onEditContent: (day: number) => void;
}

export default function AdminContentTable({ totalDays, onEditContent }: AdminContentTableProps) {
  const [previewContent, setPreviewContent] = useState<Content | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch all content
  const { data: allContent, isLoading } = useQuery<Content[]>({
    queryKey: ["/api/content"],
  });
  
  // Get content type badge color
  const getTypeColor = (type: ContentType): string => {
    switch (type) {
      case "text": return "bg-blue-100 text-blue-800";
      case "image": return "bg-green-100 text-green-800";
      case "video": return "bg-red-100 text-red-800";
      case "audio": return "bg-purple-100 text-purple-800";
      case "citation": return "bg-yellow-100 text-yellow-800";
      case "link": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get content type display name
  const getTypeDisplayName = (type: ContentType): string => {
    switch (type) {
      case "text": return "Texte";
      case "image": return "Image";
      case "video": return "Vidéo";
      case "audio": return "Audio";
      case "citation": return "Citation";
      case "link": return "Lien";
      default: return type;
    }
  };
  
  // Get summary of content
  const getContentSummary = (content: Content): string => {
    const data = content.content as Record<string, any>;
    switch (content.type as ContentType) {
      case "text":
        return data.text ? (data.text.length > 50 ? data.text.substring(0, 50) + "..." : data.text) : "";
      case "image":
        return data.imageCaption || "Image sans légende";
      case "video":
        return "Vidéo YouTube";
      case "audio":
        return "Fichier audio";
      case "citation":
        return data.citationText ? (data.citationText.length > 50 ? data.citationText.substring(0, 50) + "..." : data.citationText) : "";
      case "link":
        return data.linkDescription || data.linkUrl || "Lien externe";
      default:
        return "Contenu non disponible";
    }
  };
  
  // Handle preview
  const handlePreview = (content: Content) => {
    setPreviewContent(content);
    setIsPreviewOpen(true);
  };
  
  // Generate array of days 1 to totalDays
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  
  // Get content for a specific day
  const getContentForDay = (day: number): Content | undefined => {
    return allContent?.find(content => content.day === day);
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement des contenus...</div>;
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-[Cinzel] mb-6">Contenus par jour</h2>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Jour</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Aperçu</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daysArray.map(day => {
              const content = getContentForDay(day);
              return (
                <TableRow key={day}>
                  <TableCell className="font-medium">{day}</TableCell>
                  <TableCell>
                    {content ? (
                      content.title
                    ) : (
                      <span className="text-gray-400 italic">Aucun contenu</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {content ? (
                      <Badge className={getTypeColor(content.type as ContentType)}>
                        {getTypeDisplayName(content.type as ContentType)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Non défini</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {content ? (
                      getContentSummary(content)
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditContent(day)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Éditer
                      </Button>
                      {content && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(content)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Content Preview Modal */}
      {previewContent && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-2xl p-0">
            <ContentModal 
              isOpen={true}
              onClose={() => setIsPreviewOpen(false)}
              content={previewContent}
              titleColor="#1E3A8A"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
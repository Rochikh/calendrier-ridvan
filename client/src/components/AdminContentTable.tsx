import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Content, ContentType } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteContent } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import ContentModal from "./ContentModal";

interface AdminContentTableProps {
  totalDays: number;
  onEditContent: (day: number) => void;
}

export default function AdminContentTable({ totalDays, onEditContent }: AdminContentTableProps) {
  const [previewContent, setPreviewContent] = useState<Content | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<Content | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all content
  const { data: contentList, isLoading } = useQuery<Content[]>({
    queryKey: ["/api/content"],
  });
  
  // Delete content mutation
  const deleteMutation = useMutation({
    mutationFn: (day: number) => deleteContent(day),
    onSuccess: () => {
      toast({
        title: "Contenu supprimé",
        description: "Le contenu a été supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setContentToDelete(null);
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de suppression",
        description: `Échec de la suppression du contenu: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Get type color for badge
  const getTypeColor = (type: ContentType): string => {
    switch (type) {
      case "text":
        return "bg-blue-100 text-blue-800";
      case "image":
        return "bg-green-100 text-green-800";
      case "video":
        return "bg-red-100 text-red-800";
      case "audio":
        return "bg-purple-100 text-purple-800";
      case "citation":
        return "bg-yellow-100 text-yellow-800";
      case "link":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get display name for content type
  const getTypeDisplayName = (type: ContentType): string => {
    switch (type) {
      case "text":
        return "Texte";
      case "image":
        return "Image";
      case "video":
        return "Vidéo";
      case "audio":
        return "Audio";
      case "citation":
        return "Citation";
      case "link":
        return "Lien";
      default:
        return type;
    }
  };

  // Get content summary
  const getContentSummary = (content: Content): string => {
    if (!content.content) return "Contenu vide";
    
    try {
      const contentObj = content.content as any;
      
      switch (content.type) {
        case "text": 
          return contentObj.text 
            ? `${String(contentObj.text).substring(0, 50)}${String(contentObj.text).length > 50 ? '...' : ''}`
            : "Texte non disponible";
        case "image":
          return contentObj.imageUrl
            ? (contentObj.imageCaption 
                ? `${String(contentObj.imageCaption).substring(0, 50)}${String(contentObj.imageCaption).length > 50 ? '...' : ''}`
                : "Image sans légende") 
            : "Image non disponible";
        case "video":
          return contentObj.videoUrl
            ? "Vidéo disponible" 
            : "Vidéo non disponible";
        case "audio":
          return contentObj.audioUrl
            ? "Audio disponible" 
            : "Audio non disponible";
        case "citation":
          return contentObj.citationText
            ? `${String(contentObj.citationText).substring(0, 50)}${String(contentObj.citationText).length > 50 ? '...' : ''}` 
            : "Citation non disponible";
        case "link":
          return contentObj.linkUrl
            ? (contentObj.linkDescription 
                ? `${String(contentObj.linkDescription).substring(0, 50)}${String(contentObj.linkDescription).length > 50 ? '...' : ''}`
                : String(contentObj.linkUrl)) 
            : "Lien non disponible";
        default:
          return "Type de contenu inconnu";
      }
    } catch (error) {
      console.error("Erreur lors de l'affichage du résumé du contenu:", error);
      return "Erreur d'affichage";
    }
  };

  // Handle preview button click
  const handlePreview = (content: Content) => {
    setPreviewContent(content);
    setShowModal(true);
  };

  // Generate empty rows for days without content
  const emptyDays = Array.from({ length: totalDays }, (_, i) => i + 1)
    .filter(day => !contentList?.some((item) => item.day === day));

  if (isLoading) {
    return <div className="p-4">Chargement du contenu...</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-[Cinzel] text-[#1E3A8A] mb-6">Tableau de Contenu</h2>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Jour</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead className="w-24">Type</TableHead>
              <TableHead>Aperçu</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Content rows */}
            {contentList?.sort((a, b) => a.day - b.day).map((content) => (
              <TableRow key={content.id}>
                <TableCell className="font-medium">{content.day}</TableCell>
                <TableCell>{content.title}</TableCell>
                <TableCell>
                  <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeColor(content.type as ContentType)}`}>
                    {getTypeDisplayName(content.type as ContentType)}
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {getContentSummary(content)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-gray-500 hover:text-[#1E3A8A]"
                      onClick={() => handlePreview(content)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-gray-500 hover:text-[#1E3A8A]"
                      onClick={() => onEditContent(content.day)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-gray-500 hover:text-red-600"
                      onClick={() => {
                        setContentToDelete(content);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {/* Empty rows */}
            {emptyDays.map(day => (
              <TableRow key={`empty-${day}`}>
                <TableCell className="font-medium">{day}</TableCell>
                <TableCell colSpan={3} className="text-gray-500 italic">
                  Aucun contenu pour ce jour
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-gray-500 hover:text-[#1E3A8A]"
                    onClick={() => onEditContent(day)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Preview Modal */}
      {previewContent && (
        <ContentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          content={previewContent}
          titleColor="#1E3A8A"
        />
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le contenu du jour {contentToDelete?.day} ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => contentToDelete && deleteMutation.mutate(contentToDelete.day)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
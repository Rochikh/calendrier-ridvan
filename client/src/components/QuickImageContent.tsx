import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface QuickImageContentProps {
  totalDays: number;
}

export default function QuickImageContent({ totalDays }: QuickImageContentProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [title, setTitle] = useState<string>("Image content");
  const [imageUrl, setImageUrl] = useState<string>("https://placekitten.com/800/600");
  const [caption, setCaption] = useState<string>("Image caption");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/content/${selectedDay}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          type: "image",
          content: {
            imageUrl: imageUrl,
            imageCaption: caption
          }
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error ${response.status}: ${errorText}`);
        toast({
          title: "Échec de la création",
          description: `Erreur ${response.status}: ${errorText}`,
          variant: "destructive"
        });
        return;
      }
      
      const result = await response.json();
      console.log("SUCCESS: Content created with fixed URL:", result);
      
      toast({
        title: "Contenu créé",
        description: `Le contenu pour le jour ${selectedDay} a été créé avec succès avec une image`,
      });
      
      // Reload content
      queryClient.invalidateQueries({ queryKey: ["/api/content", selectedDay] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    } catch (error) {
      console.error("CREATE CONTENT ERROR:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-[Cinzel] text-[#1E3A8A] mb-6">Ajout Rapide de Contenu Image</h2>
        <p className="mb-4 text-gray-600">
          Ce formulaire permet d'ajouter facilement du contenu image pour n'importe quel jour
          sans avoir à passer par l'upload de fichier.
        </p>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <Label htmlFor="day-selector" className="block text-gray-700 font-[Inter] mb-2">Jour</Label>
            <select 
              id="day-selector" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
              value={selectedDay}
              onChange={(e) => setSelectedDay(parseInt(e.target.value))}
            >
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>Jour {day}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="title-input" className="block text-gray-700 font-[Inter] mb-2">Titre</Label>
            <Input 
              id="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du contenu"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="image-url-input" className="block text-gray-700 font-[Inter] mb-2">URL de l'image</Label>
            <Input 
              id="image-url-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL de l'image"
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Par défaut: https://placekitten.com/800/600 (image de test)
            </p>
          </div>
          
          <div>
            <Label htmlFor="caption-input" className="block text-gray-700 font-[Inter] mb-2">Légende</Label>
            <Input 
              id="caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Légende de l'image"
              className="w-full"
            />
          </div>
          
          <div className="mt-2">
            <Button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              Créer contenu image
            </Button>
          </div>
        </div>
        
        {imageUrl && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Prévisualisation</h3>
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="max-w-full h-auto rounded-md mb-2" 
              style={{ maxHeight: "200px" }}
            />
            <p className="text-sm text-gray-600">{caption}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Settings form schema
const formSchema = z.object({
  appTitle: z.string().min(1, "Le titre ne peut pas être vide").max(100, "Le titre est trop long"),
  totalDays: z.number().min(1).max(30),
  titleColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Invalid hex color code"),
  starColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Invalid hex color code"),
  starBorderColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Invalid hex color code"),
  backgroundImage: z.string().url("Invalid URL")
});

type FormValues = z.infer<typeof formSchema>;

interface AdminSettingsFormProps {
  settings?: Settings;
}

export default function AdminSettingsForm({ settings }: AdminSettingsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default settings values
  const defaultValues = {
    appTitle: settings?.appTitle || "Calendrier de Riḍván",
    totalDays: settings?.totalDays || 19,
    titleColor: settings?.titleColor || "#1E3A8A",
    starColor: settings?.starColor || "#FCD34D",
    starBorderColor: settings?.starBorderColor || "#F59E0B",
    backgroundImage: settings?.backgroundImage || "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=2048&q=80"
  };
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  // Update settings when props change
  // Utiliser useEffect pour éviter le problème de mise à jour pendant le rendu
  useEffect(() => {
    if (settings) {
      const currentValues = form.getValues();
      
      if (settings.appTitle !== currentValues.appTitle ||
          settings.totalDays !== currentValues.totalDays ||
          settings.titleColor !== currentValues.titleColor ||
          settings.starColor !== currentValues.starColor ||
          settings.starBorderColor !== currentValues.starBorderColor ||
          settings.backgroundImage !== currentValues.backgroundImage) {
        
        // Mettre à jour le formulaire
        form.reset({
          appTitle: settings.appTitle,
          totalDays: settings.totalDays,
          titleColor: settings.titleColor,
          starColor: settings.starColor,
          starBorderColor: settings.starBorderColor,
          backgroundImage: settings.backgroundImage
        });
        
        // Mettre à jour également les couleurs dans l'état local
        setColorInputs({
          titleColor: settings.titleColor,
          starColor: settings.starColor,
          starBorderColor: settings.starBorderColor
        });
      }
    }
  }, [settings, form]);
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("PUT", "/api/settings", data);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Settings saved successfully:", data);
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres du calendrier ont été mis à jour",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      console.error("Update settings error:", error);
      toast({
        title: "Échec de la sauvegarde",
        description: "Une erreur s'est produite lors de la sauvegarde des paramètres",
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: FormValues) => {
    updateSettingsMutation.mutate(data);
  };
  
  // Sync color inputs with hex inputs
  const [colorInputs, setColorInputs] = useState({
    titleColor: settings?.titleColor || defaultValues.titleColor,
    starColor: settings?.starColor || defaultValues.starColor,
    starBorderColor: settings?.starBorderColor || defaultValues.starBorderColor
  });
  
  const handleColorChange = (colorType: string, value: string) => {
    setColorInputs(prev => ({ ...prev, [colorType]: value }));
    form.setValue(colorType as "titleColor" | "starColor" | "starBorderColor", value, { shouldValidate: true });
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-[Cinzel] text-[#1E3A8A] mb-6">Visual Settings</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Application Title Setting */}
            <FormField
              control={form.control}
              name="appTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-gray-700 font-[Inter] mb-2">Titre de l'application</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      placeholder="Calendrier de Riḍván" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-gray-500 mt-1">Nom affiché en haut de l'application</FormDescription>
                </FormItem>
              )}
            />
            
            {/* Number of Days Setting */}
            <FormField
              control={form.control}
              name="totalDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-gray-700 font-[Inter] mb-2">Number of Days</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={30} 
                      {...field}
                      // Convert string to number for the input
                      onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-gray-500 mt-1">Set between 1-30 days</FormDescription>
                </FormItem>
              )}
            />
            
            {/* Title Color Setting */}
            <FormField
              control={form.control}
              name="titleColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-gray-700 font-[Inter] mb-2">Title Color</FormLabel>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={colorInputs.titleColor}
                      onChange={e => handleColorChange("titleColor", e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="#1E3A8A" 
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                        onChange={e => handleColorChange("titleColor", e.target.value)}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Star Color Setting */}
            <FormField
              control={form.control}
              name="starColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-gray-700 font-[Inter] mb-2">Star Color</FormLabel>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={colorInputs.starColor}
                      onChange={e => handleColorChange("starColor", e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="#FCD34D" 
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                        onChange={e => handleColorChange("starColor", e.target.value)}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Star Border Color Setting */}
            <FormField
              control={form.control}
              name="starBorderColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-gray-700 font-[Inter] mb-2">Star Border Color</FormLabel>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={colorInputs.starBorderColor}
                      onChange={e => handleColorChange("starBorderColor", e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="#F59E0B" 
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                        onChange={e => handleColorChange("starBorderColor", e.target.value)}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Background Image Setting */}
            <FormField
              control={form.control}
              name="backgroundImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-gray-700 font-[Inter] mb-2">Background Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      type="url" 
                      placeholder="Enter background image URL" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-gray-500 mt-1">Leave empty for default</FormDescription>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="bg-[#1E3A8A] text-white font-[Inter] font-medium py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

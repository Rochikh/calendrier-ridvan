import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Content, ContentType, contentTypeSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, CardContent, 
  Form, FormControl, FormField, FormItem, FormLabel,
  Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Button
} from "@/components/ui";

// Content form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: contentTypeSchema,
  // Content fields - conditionally required based on type
  text: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  imageCaption: z.string().optional().or(z.literal("")),
  videoUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  audioUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  citationText: z.string().optional().or(z.literal("")),
  citationSource: z.string().optional().or(z.literal("")),
  linkUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  linkDescription: z.string().optional().or(z.literal(""))
}).superRefine((data, ctx) => {
  // Validate required fields based on type
  switch (data.type) {
    case "text":
      if (!data.text) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le contenu texte est requis",
          path: ["text"]
        });
      }
      break;
    case "image":
      if (!data.imageUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'URL de l'image est requise",
          path: ["imageUrl"]
        });
      }
      break;
    case "video":
      if (!data.videoUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'URL de la vidéo est requise",
          path: ["videoUrl"]
        });
      }
      break;
    case "audio":
      if (!data.audioUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'URL du fichier audio est requise",
          path: ["audioUrl"]
        });
      }
      break;
    case "citation":
      if (!data.citationText) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le texte de citation est requis",
          path: ["citationText"]
        });
      }
      break;
    case "link":
      if (!data.linkUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'URL du lien est requise",
          path: ["linkUrl"]
        });
      }
      break;
  }
});

type FormValues = z.infer<typeof formSchema>;

interface AdminContentFormProps {
  totalDays: number;
}

export default function AdminContentForm({ totalDays }: AdminContentFormProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch content for selected day
  const { data: content, isLoading: isLoadingContent } = useQuery<Content>({
    queryKey: ["/api/content", selectedDay],
  });
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "text",
      text: "",
      imageUrl: "",
      imageCaption: "",
      videoUrl: "",
      audioUrl: "",
      citationText: "",
      citationSource: "",
      linkUrl: "",
      linkDescription: ""
    }
  });
  
  // Update form when content is loaded
  useEffect(() => {
    if (content) {
      const { title, type, content: contentObj } = content;
      
      // Create a typed content data object
      const contentData: Record<string, string> = {};
      
      // Type-safe content handling based on content type
      if (contentObj && typeof contentObj === 'object') {
        switch (type) {
          case 'text':
            if ('text' in contentObj && typeof contentObj.text === 'string') {
              contentData.text = contentObj.text;
            }
            break;
          case 'image':
            if ('imageUrl' in contentObj && typeof contentObj.imageUrl === 'string') {
              contentData.imageUrl = contentObj.imageUrl;
            }
            if ('imageCaption' in contentObj && typeof contentObj.imageCaption === 'string') {
              contentData.imageCaption = contentObj.imageCaption;
            }
            break;
          case 'video':
            if ('videoUrl' in contentObj && typeof contentObj.videoUrl === 'string') {
              contentData.videoUrl = contentObj.videoUrl;
            }
            break;
          case 'audio':
            if ('audioUrl' in contentObj && typeof contentObj.audioUrl === 'string') {
              contentData.audioUrl = contentObj.audioUrl;
            }
            break;
          case 'citation':
            if ('citationText' in contentObj && typeof contentObj.citationText === 'string') {
              contentData.citationText = contentObj.citationText;
            }
            if ('citationSource' in contentObj && typeof contentObj.citationSource === 'string') {
              contentData.citationSource = contentObj.citationSource;
            }
            break;
          case 'link':
            if ('linkUrl' in contentObj && typeof contentObj.linkUrl === 'string') {
              contentData.linkUrl = contentObj.linkUrl;
            }
            if ('linkDescription' in contentObj && typeof contentObj.linkDescription === 'string') {
              contentData.linkDescription = contentObj.linkDescription;
            }
            break;
        }
      }
      
      // Reset form with content values
      form.reset({
        title,
        type: type as ContentType,
        // Set appropriate content field based on type
        text: contentData.text || "",
        imageUrl: contentData.imageUrl || "",
        imageCaption: contentData.imageCaption || "",
        videoUrl: contentData.videoUrl || "",
        audioUrl: contentData.audioUrl || "",
        citationText: contentData.citationText || "",
        citationSource: contentData.citationSource || "",
        linkUrl: contentData.linkUrl || "",
        linkDescription: contentData.linkDescription || ""
      });
    } else {
      // Reset form with empty values for new content
      form.reset({
        title: `Day ${selectedDay}`,
        type: "text",
        text: "",
        imageUrl: "",
        imageCaption: "",
        videoUrl: "",
        audioUrl: "",
        citationText: "",
        citationSource: "",
        linkUrl: "",
        linkDescription: ""
      });
    }
  }, [content, selectedDay, form]);
  
  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Create content data object based on content type
      let contentData: any = {};
      
      switch (data.type) {
        case "text":
          contentData = { text: data.text };
          break;
        case "image":
          contentData = { 
            imageUrl: data.imageUrl,
            imageCaption: data.imageCaption
          };
          break;
        case "video":
          contentData = { videoUrl: data.videoUrl };
          break;
        case "audio":
          contentData = { audioUrl: data.audioUrl };
          break;
        case "citation":
          contentData = { 
            citationText: data.citationText,
            citationSource: data.citationSource
          };
          break;
        case "link":
          contentData = { 
            linkUrl: data.linkUrl,
            linkDescription: data.linkDescription
          };
          break;
      }
      
      console.log("Sending request to PUT /api/content/" + selectedDay);
      console.log("Request payload:", {
        title: data.title,
        type: data.type,
        content: contentData
      });
      
      try {
        const response = await fetch(`/api/content/${selectedDay}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.title,
            type: data.type,
            content: contentData
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log("API response:", responseData);
        return responseData;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Content saved successfully:", data);
      toast({
        title: "Contenu sauvegardé",
        description: `Le contenu pour le jour ${selectedDay} a été mis à jour`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content", selectedDay] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: (error) => {
      console.error("Update content error:", error);
      toast({
        title: "Échec de la sauvegarde",
        description: "Une erreur s'est produite lors de la sauvegarde du contenu",
        variant: "destructive"
      });
    }
  });
  
  // Handle day change
  const handleDayChange = (day: number) => {
    setSelectedDay(day);
  };
  
  // Handle form submission
  const onSubmit = (data: FormValues) => {
    console.log("Submitting form with data:", data);
    try {
      updateContentMutation.mutate(data);
      console.log("Mutation called successfully");
    } catch (error) {
      console.error("Error during mutation:", error);
    }
  };
  
  // Get content type for conditional rendering
  const contentType = form.watch("type");
  
  // Handle image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  useEffect(() => {
    const imageUrl = form.watch("imageUrl");
    if (imageUrl && contentType === "image") {
      setImagePreview(imageUrl);
    } else {
      setImagePreview(null);
    }
  }, [form.watch("imageUrl"), contentType, form]);
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-[Cinzel] text-[#1E3A8A] mb-6">Content Management</h2>
        
        {/* Day Selector */}
        <div className="mb-6">
          <label htmlFor="day-selector" className="block text-gray-700 font-[Inter] mb-2">Select Day</label>
          <select 
            id="day-selector" 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
            value={selectedDay}
            onChange={(e) => handleDayChange(parseInt(e.target.value))}
          >
            {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>Day {day}</option>
            ))}
          </select>
        </div>
        
        {/* Content Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-gray-700 font-[Inter] mb-2">Title</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter content title" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Content Type Field */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-gray-700 font-[Inter] mb-2">Content Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="citation">Citation</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            {/* Text Content Fields */}
            {contentType === "text" && (
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-gray-700 font-[Inter] mb-2">Text Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={6} 
                        placeholder="Enter text content" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            
            {/* Image Content Fields */}
            {contentType === "image" && (
              <>
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-gray-700 font-[Inter] mb-2">Image URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="url" 
                          placeholder="Enter image URL" 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="imageCaption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-gray-700 font-[Inter] mb-2">Caption</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter image caption (optional)" 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-[Inter] mb-2">Preview</label>
                  <div className="border border-gray-300 rounded-lg p-2 h-48 bg-gray-100 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-gray-500 font-[Inter]">Image preview will appear here</span>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Video Content Fields */}
            {contentType === "video" && (
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-gray-700 font-[Inter] mb-2">Video URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="url" 
                        placeholder="Enter video URL (YouTube, Vimeo, etc.)" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            
            {/* Audio Content Fields */}
            {contentType === "audio" && (
              <FormField
                control={form.control}
                name="audioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-gray-700 font-[Inter] mb-2">Audio URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="url" 
                        placeholder="Enter audio file URL" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            
            {/* Citation Content Fields */}
            {contentType === "citation" && (
              <>
                <FormField
                  control={form.control}
                  name="citationText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-gray-700 font-[Inter] mb-2">Citation Text</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={4} 
                          placeholder="Enter citation text" 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="citationSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-gray-700 font-[Inter] mb-2">Source</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter citation source (optional)" 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {/* External Link Content Fields */}
            {contentType === "link" && (
              <>
                <FormField
                  control={form.control}
                  name="linkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-gray-700 font-[Inter] mb-2">Link URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="url" 
                          placeholder="Enter external link URL" 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="linkDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-gray-700 font-[Inter] mb-2">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3} 
                          placeholder="Enter link description (optional)" 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {/* Display form errors */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
                <p className="font-medium">Des erreurs sont présentes dans le formulaire :</p>
                <ul className="list-disc list-inside mt-1">
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <li key={field}>
                      {field}: {error?.message?.toString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="bg-[#1E3A8A] text-white font-[Inter] font-medium py-4 px-8 text-lg rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors w-full md:w-auto"
              disabled={updateContentMutation.isPending}
            >
              {updateContentMutation.isPending ? "Enregistrement..." : "Enregistrer le contenu"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

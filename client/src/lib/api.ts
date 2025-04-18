import { apiRequest } from "./queryClient";
import { Settings, Content } from "@shared/schema";

// Interface pour la réponse d'upload de fichier
export interface UploadResponse {
  success: boolean;
  fileUrl: string;
  fileType: "image" | "video";
  originalName: string;
  size: number;
}

// Settings API
export async function getSettings(): Promise<Settings> {
  const response = await apiRequest("GET", "/api/settings", undefined);
  return response.json();
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  const response = await apiRequest("PUT", "/api/settings", settings);
  return response.json();
}

// Content API
export async function getContent(day: number): Promise<Content> {
  const response = await apiRequest("GET", `/api/content/${day}`, undefined);
  return response.json();
}

export async function getAllContent(): Promise<Content[]> {
  const response = await apiRequest("GET", "/api/content", undefined);
  return response.json();
}

export async function updateContent(day: number, content: Partial<Omit<Content, "id" | "day">>): Promise<Content> {
  const response = await apiRequest("PUT", `/api/content/${day}`, content);
  return response.json();
}

// Auth API
export async function login(password: string): Promise<void> {
  await apiRequest("POST", "/api/login", { password });
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/logout", {});
}

export async function getAuthStatus(): Promise<{ isLoggedIn: boolean }> {
  const response = await apiRequest("GET", "/api/auth/status", undefined);
  return response.json();
}

// Fonction d'upload de fichier
export async function uploadFile(file: File): Promise<UploadResponse> {
  // Pour l'upload de fichiers, nous devons utiliser FormData et ne pas passer par apiRequest
  // car apiRequest est configuré pour JSON
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include" // Important pour inclure les cookies d'authentification
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to upload file");
  }
  
  return response.json();
}

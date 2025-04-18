import { apiRequest } from "./queryClient";
import { Settings, Content } from "@shared/schema";

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

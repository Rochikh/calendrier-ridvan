import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keeping the original one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Settings table for visual customization
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  appTitle: text("app_title").notNull().default("Calendrier de Riḍván"),
  appDescription: text("app_description").notNull().default("The Festival of Paradise"),
  titleColor: text("title_color").notNull().default("#1E3A8A"),
  starColor: text("star_color").notNull().default("#FCD34D"),
  starBorderColor: text("star_border_color").notNull().default("#F59E0B"),
  backgroundImage: text("background_image").notNull().default("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=2048&q=80"),
  totalDays: integer("total_days").notNull().default(19),
  updatedAt: text("updated_at").notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

// Content table for daily content
export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  day: integer("day").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // text, image, video, audio, citation, link
  content: jsonb("content").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
});

// Session table for admin access
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Content types for frontend validation
export const contentTypeSchema = z.enum([
  "text", 
  "image", 
  "video", 
  "audio", 
  "citation", 
  "link"
]);

export type ContentType = z.infer<typeof contentTypeSchema>;

// Content JSON schemas for different content types
export const textContentSchema = z.object({
  text: z.string().min(1)
});

export const imageContentSchema = z.object({
  imageUrl: z.string().url(),
  imageCaption: z.string().optional()
});

export const videoContentSchema = z.object({
  videoUrl: z.string().url()
});

export const audioContentSchema = z.object({
  audioUrl: z.string().url()
});

export const citationContentSchema = z.object({
  citationText: z.string().min(1),
  citationSource: z.string().optional()
});

export const linkContentSchema = z.object({
  linkUrl: z.string().url(),
  linkDescription: z.string().optional()
});

// Combined content schema for validation
export const contentDataSchema = z.union([
  textContentSchema,
  imageContentSchema,
  videoContentSchema,
  audioContentSchema,
  citationContentSchema,
  linkContentSchema
]);

export type ContentData = z.infer<typeof contentDataSchema>;

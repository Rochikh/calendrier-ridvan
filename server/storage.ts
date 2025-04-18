import { 
  users, type User, type InsertUser,
  settings, type Settings, type InsertSettings,
  content, type Content, type InsertContent,
  sessions, type Session, type InsertSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(updatedSettings: Partial<InsertSettings>): Promise<Settings>;
  initializeSettings(): Promise<Settings>;
  
  // Content
  getContent(day: number): Promise<Content | undefined>;
  getAllContent(): Promise<Content[]>;
  updateContent(day: number, contentData: Partial<InsertContent>): Promise<Content>;
  
  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  cleanExpiredSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings);
    return setting;
  }
  
  async updateSettings(updatedSettings: Partial<InsertSettings>): Promise<Settings> {
    const now = new Date().toISOString();
    const [setting] = await db.select().from(settings);
    
    if (setting) {
      const [updated] = await db
        .update(settings)
        .set({ ...updatedSettings, updatedAt: now })
        .where(eq(settings.id, setting.id))
        .returning();
      return updated;
    } else {
      return this.initializeSettings();
    }
  }
  
  async initializeSettings(): Promise<Settings> {
    const now = new Date().toISOString();
    const defaultSettings: InsertSettings = {
      titleColor: "#1E3A8A",
      starColor: "#FCD34D",
      starBorderColor: "#F59E0B",
      backgroundImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=2048&q=80",
      totalDays: 19,
      updatedAt: now
    };
    
    const [setting] = await db
      .insert(settings)
      .values(defaultSettings)
      .returning();
    
    return setting;
  }
  
  // Content methods
  async getContent(day: number): Promise<Content | undefined> {
    console.log(`Storage: Fetching content for day ${day}`);
    
    const query = db
      .select()
      .from(content)
      .where(eq(content.day, day));
      
    console.log("SQL query:", query.toSQL());
    
    const results = await query;
    console.log(`Query results for day ${day}:`, results);
    
    const [contentItem] = results;
    return contentItem;
  }
  
  async getAllContent(): Promise<Content[]> {
    return await db
      .select()
      .from(content)
      .orderBy(content.day);
  }
  
  async updateContent(day: number, contentData: Partial<InsertContent>): Promise<Content> {
    const now = new Date().toISOString();
    const [existingContent] = await db
      .select()
      .from(content)
      .where(eq(content.day, day));
    
    if (existingContent) {
      const [updated] = await db
        .update(content)
        .set({ ...contentData, updatedAt: now })
        .where(eq(content.id, existingContent.id))
        .returning();
      return updated;
    } else {
      const [newContent] = await db
        .insert(content)
        .values({ 
          day, 
          title: contentData.title || `Day ${day}`, 
          type: contentData.type || "text", 
          content: contentData.content || { text: "" }, 
          updatedAt: now 
        })
        .returning();
      return newContent;
    }
  }
  
  // Session methods
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db
      .insert(sessions)
      .values(session)
      .returning();
    
    return newSession;
  }
  
  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));
    
    return session;
  }
  
  async deleteSession(token: string): Promise<void> {
    await db
      .delete(sessions)
      .where(eq(sessions.token, token));
  }
  
  async cleanExpiredSessions(): Promise<void> {
    const now = new Date().toISOString();
    await db
      .delete(sessions)
      .where(eq(sessions.expiresAt, now));
  }
}

// Create the storage implementation
export const storage = new DatabaseStorage();

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
  deleteContent(day: number): Promise<void>;
  
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
    try {
      console.log("💾 [Storage] updateSettings - Starting update with data:", updatedSettings);
      const now = new Date().toISOString();
      
      console.log("💾 [Storage] updateSettings - Checking if settings exist");
      let setting;
      try {
        [setting] = await db.select().from(settings);
        console.log("💾 [Storage] updateSettings - Settings found:", setting ? "Yes" : "No");
      } catch (selectError) {
        console.error("❌ [Storage] updateSettings - Error selecting settings:", selectError);
        throw new Error(`Database select error: ${(selectError as Error).message}`);
      }
      
      if (setting) {
        console.log(`💾 [Storage] updateSettings - Updating existing settings with ID ${setting.id}`);
        try {
          const updateQuery = db
            .update(settings)
            .set({ ...updatedSettings, updatedAt: now })
            .where(eq(settings.id, setting.id))
            .returning();
          
          console.log("💾 [Storage] updateSettings - Generated SQL:", updateQuery.toSQL());
          
          const [updated] = await updateQuery;
          console.log("💾 [Storage] updateSettings - Update successful:", updated);
          return updated;
        } catch (updateError) {
          console.error("❌ [Storage] updateSettings - Error updating settings:", updateError);
          throw new Error(`Database update error: ${(updateError as Error).message}`);
        }
      } else {
        console.log("💾 [Storage] updateSettings - No settings found, initializing...");
        return this.initializeSettings();
      }
    } catch (error) {
      console.error("❌ [Storage] updateSettings - Unhandled error:", error);
      throw error; // Propagate to caller
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
    try {
      console.log(`💾 [Storage] updateContent - Starting update for day ${day} with data:`, contentData);
      const now = new Date().toISOString();
      
      console.log(`💾 [Storage] updateContent - Checking if content exists for day ${day}`);
      let existingContent;
      try {
        const selectQuery = db
          .select()
          .from(content)
          .where(eq(content.day, day));
          
        console.log("💾 [Storage] updateContent - Generated SELECT SQL:", selectQuery.toSQL());
        [existingContent] = await selectQuery;
        console.log(`💾 [Storage] updateContent - Content found for day ${day}:`, existingContent ? "Yes" : "No");
      } catch (selectError) {
        console.error(`❌ [Storage] updateContent - Error selecting content for day ${day}:`, selectError);
        throw new Error(`Database select error: ${(selectError as Error).message}`);
      }
      
      if (existingContent) {
        console.log(`💾 [Storage] updateContent - Updating existing content for day ${day} with ID ${existingContent.id}`);
        try {
          const updateQuery = db
            .update(content)
            .set({ ...contentData, updatedAt: now })
            .where(eq(content.id, existingContent.id))
            .returning();
            
          console.log("💾 [Storage] updateContent - Generated UPDATE SQL:", updateQuery.toSQL());
          
          const [updated] = await updateQuery;
          console.log(`💾 [Storage] updateContent - Update successful for day ${day}:`, updated);
          return updated;
        } catch (updateError) {
          console.error(`❌ [Storage] updateContent - Error updating content for day ${day}:`, updateError);
          throw new Error(`Database update error: ${(updateError as Error).message}`);
        }
      } else {
        console.log(`💾 [Storage] updateContent - No content found for day ${day}, creating new entry`);
        try {
          const insertQuery = db
            .insert(content)
            .values({ 
              day, 
              title: contentData.title || `Day ${day}`, 
              type: contentData.type || "text", 
              content: contentData.content || { text: "" }, 
              updatedAt: now 
            })
            .returning();
            
          console.log("💾 [Storage] updateContent - Generated INSERT SQL:", insertQuery.toSQL());
          
          const [newContent] = await insertQuery;
          console.log(`💾 [Storage] updateContent - Insert successful for day ${day}:`, newContent);
          return newContent;
        } catch (insertError) {
          console.error(`❌ [Storage] updateContent - Error inserting content for day ${day}:`, insertError);
          throw new Error(`Database insert error: ${(insertError as Error).message}`);
        }
      }
    } catch (error) {
      console.error(`❌ [Storage] updateContent - Unhandled error for day ${day}:`, error);
      throw error; // Propagate to caller
    }
  }
  
  async deleteContent(day: number): Promise<void> {
    console.log(`Deleting content for day ${day}`);
    
    const [existingContent] = await db
      .select()
      .from(content)
      .where(eq(content.day, day));
    
    if (existingContent) {
      await db
        .delete(content)
        .where(eq(content.day, day));
      
      console.log(`Content for day ${day} deleted successfully`);
    } else {
      console.log(`No content found for day ${day}`);
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

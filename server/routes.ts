import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomBytes } from "crypto";
import { contentDataSchema, contentTypeSchema, insertContentSchema, insertSettingsSchema } from "@shared/schema";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { z } from "zod";
import { ZodError } from "zod";

// Extend express-session declarations to include token
declare module 'express-session' {
  export interface Session {
    token?: string;
  }
}

// Fixed admin password
const ADMIN_PASSWORD = "9999";

// Initialize settings on startup
const initializeDatabase = async () => {
  try {
    // Initialize settings if they don't exist
    await storage.getSettings() || await storage.initializeSettings();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

// Auth middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionToken = req.session.token;
  
  if (!sessionToken) {
    return res.status(401).json({ message: "Unauthorized: No session found" });
  }
  
  try {
    const session = await storage.getSessionByToken(sessionToken);
    
    if (!session) {
      return res.status(401).json({ message: "Unauthorized: Invalid session" });
    }
    
    // Check session expiration
    if (new Date(session.expiresAt) < new Date()) {
      await storage.deleteSession(sessionToken);
      return res.status(401).json({ message: "Unauthorized: Session expired" });
    }
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "ridvan-calendar-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      // Create new session
      const token = randomBytes(32).toString("hex");
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      
      const session = await storage.createSession({
        token,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString()
      });
      
      // Save token to session
      req.session.token = token;
      
      return res.status(200).json({ message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Error during login" });
    }
  });
  
  app.post("/api/logout", async (req, res) => {
    try {
      const token = req.session.token;
      
      if (token) {
        await storage.deleteSession(token);
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destruction error:", err);
          }
        });
      }
      
      return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Error during logout" });
    }
  });
  
  app.get("/api/auth/status", async (req, res) => {
    try {
      const token = req.session.token;
      
      if (!token) {
        return res.status(200).json({ isLoggedIn: false });
      }
      
      const session = await storage.getSessionByToken(token);
      
      if (!session || new Date(session.expiresAt) < new Date()) {
        return res.status(200).json({ isLoggedIn: false });
      }
      
      return res.status(200).json({ isLoggedIn: true });
    } catch (error) {
      console.error("Auth status error:", error);
      return res.status(200).json({ isLoggedIn: false });
    }
  });
  
  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      let settings = await storage.getSettings();
      
      if (!settings) {
        settings = await storage.initializeSettings();
      }
      
      return res.status(200).json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      return res.status(500).json({ message: "Error fetching settings" });
    }
  });
  
  app.put("/api/settings", requireAuth, async (req, res) => {
    try {
      const updatedSettings = req.body;
      
      // Validate settings data
      const validatedData = insertSettingsSchema.partial().parse(updatedSettings);
      
      const settings = await storage.updateSettings(validatedData);
      
      return res.status(200).json(settings);
    } catch (error) {
      console.error("Update settings error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid settings data", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ message: "Error updating settings" });
    }
  });
  
  // Content routes
  app.get("/api/content/:day", async (req, res) => {
    try {
      const day = parseInt(req.params.day);
      
      if (isNaN(day) || day < 1 || day > 30) {
        return res.status(400).json({ message: "Invalid day parameter. Must be between 1 and 30." });
      }
      
      let contentItem = await storage.getContent(day);
      
      if (!contentItem) {
        return res.status(404).json({ message: `No content found for day ${day}` });
      }
      
      return res.status(200).json(contentItem);
    } catch (error) {
      console.error(`Get content error for day ${req.params.day}:`, error);
      return res.status(500).json({ message: "Error fetching content" });
    }
  });
  
  app.get("/api/content", async (req, res) => {
    try {
      const content = await storage.getAllContent();
      return res.status(200).json(content);
    } catch (error) {
      console.error("Get all content error:", error);
      return res.status(500).json({ message: "Error fetching all content" });
    }
  });
  
  app.put("/api/content/:day", requireAuth, async (req, res) => {
    try {
      const day = parseInt(req.params.day);
      
      if (isNaN(day) || day < 1 || day > 30) {
        return res.status(400).json({ message: "Invalid day parameter. Must be between 1 and 30." });
      }
      
      const { title, type, content: contentData } = req.body;
      
      // Validate content type
      const validatedType = contentTypeSchema.parse(type);
      
      // Validate content data based on type
      contentDataSchema.parse(contentData);
      
      // Update content
      const updatedContent = await storage.updateContent(day, {
        title,
        type: validatedType,
        content: contentData
      });
      
      return res.status(200).json(updatedContent);
    } catch (error) {
      console.error(`Update content error for day ${req.params.day}:`, error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid content data", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ message: "Error updating content" });
    }
  });

  // Initialize database on startup
  await initializeDatabase();
  
  const httpServer = createServer(app);
  return httpServer;
}

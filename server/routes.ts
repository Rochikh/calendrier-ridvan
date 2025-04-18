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
import { upload, handleFileUpload } from "./upload";
import path from "path";
import express from "express";

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

// Auth middleware (simplified to use session directly)
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.token) {
    return res.status(401).json({ message: "Unauthorized: Please log in to access this resource" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create and configure PostgreSQL session store
  const PgSession = connectPgSimple(session);

  // Create session table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    )
  `);

  // Setup session middleware with PostgreSQL store
  app.use(session({
    store: new PgSession({
      pool,
      tableName: 'session'
    }),
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
      
      // Create a simpler session token
      const token = randomBytes(32).toString("hex");
      
      // Save token to session (express-session will save this to DB)
      req.session.token = token;
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Error saving session" });
        }
        
        return res.status(200).json({ message: "Login successful" });
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Error during login" });
    }
  });
  
  app.post("/api/logout", (req, res) => {
    // Simply destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Error during logout" });
      }
      
      return res.status(200).json({ message: "Logout successful" });
    });
  });
  
  app.get("/api/auth/status", async (req, res) => {
    try {
      // Just check if the token exists in the session
      // This is simpler and will work with the session store
      const isLoggedIn = !!req.session.token;
      return res.status(200).json({ isLoggedIn });
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
      
      console.log(`Getting content for specific day: ${day}`);
      let contentItem = await storage.getContent(day);
      
      if (!contentItem) {
        return res.status(404).json({ message: `No content found for day ${day}` });
      }
      
      // Retourner l'objet contentItem directement, pas dans un tableau
      return res.status(200).json([contentItem]); // On garde le format tableau pour éviter de changer le frontend à nouveau
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

  // Route pour l'upload de fichiers
  app.post("/api/upload", requireAuth, upload.single("file"), handleFileUpload);
  
  // Servir les fichiers téléchargés statiquement
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  
  // Initialize database on startup
  await initializeDatabase();
  
  const httpServer = createServer(app);
  return httpServer;
}

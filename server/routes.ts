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
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

// Extend express-session declarations to include token
declare module 'express-session' {
  export interface Session {
    token?: string;
  }
}

// Fixed admin password
const ADMIN_PASSWORD = "9999";

// Importer script d'initialisation de la base de données
import { createTables } from './db-init';

// Initialize settings on startup
const initializeDatabase = async () => {
  try {
    // Créer les tables si elles n'existent pas
    await createTables();
    // Initialize settings if they don't exist
    await storage.getSettings() || await storage.initializeSettings();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

// Auth middleware (simplified to use session directly)
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 Auth check - Session:', !!req.session, 'Token exists:', !!req.session?.token);
  
  // Vérifier d'abord la session
  if (req.session.token) {
    console.log('✅ Authentication successful - Token found in session');
    return next();
  }
  
  // Si pas de token dans la session, vérifier les cookies directement
  const authTokenCookie = req.cookies.auth_token;
  if (authTokenCookie) {
    console.log('🍪 Authentication via direct cookie - Token found');
    // Restaurer le token dans la session pour les prochaines requêtes
    req.session.token = authTokenCookie;
    return next();
  }
  
  console.log('❌ Authentication failed - No valid token found');
  return res.status(401).json({ message: "Unauthorized: Please log in to access this resource" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Affiche les informations sur l'environnement
  const isDevelopment = process.env.NODE_ENV === 'development';
  const storageType = isDevelopment ? 'PostgreSQL' : 'File';
  console.log(`
🌟 ====================================== 🌟
🔧 Environment: ${process.env.NODE_ENV || 'production'}
💾 Storage Type: ${storageType}
📁 Current Directory: ${process.cwd()}
🌟 ====================================== 🌟
  `);
  
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
      // En production, le cookie secure ne fonctionne qu'avec HTTPS
      // Désactivons-le pour le moment pour résoudre le problème d'authentification
      secure: false, 
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours pour une plus longue persistance
      // Ces paramètres supplémentaires aident avec la compatibilité cross-site
      httpOnly: true,
      sameSite: 'lax'
    }
  }));
  
  // Auth routes
  app.post("/api/login", async (req, res) => {
    try {
      console.log('📥 Login attempt received');
      const { password } = req.body;
      
      if (password !== ADMIN_PASSWORD) {
        console.log('❌ Login failed - Invalid password');
        return res.status(401).json({ message: "Invalid password" });
      }
      
      // Create a simpler session token
      const token = randomBytes(32).toString("hex");
      console.log('🔑 Generated new session token');
      
      // Save token to session (express-session will save this to DB)
      req.session.token = token;
      console.log('💾 Token added to session object');
      
      // Set a cookie directly to ensure it works across environments
      res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: false,
        sameSite: 'lax'
      });
      console.log('🍪 Direct auth cookie set');
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return res.status(500).json({ message: "Error saving session" });
        }
        
        console.log('✅ Login successful - Session saved');
        return res.status(200).json({ message: "Login successful" });
      });
    } catch (error) {
      console.error("❌ Login error:", error);
      return res.status(500).json({ message: "Error during login" });
    }
  });
  
  app.post("/api/logout", (req, res) => {
    console.log('📤 Logout attempt received');
    
    // Supprimer aussi le cookie direct
    res.clearCookie('auth_token');
    console.log('🍪 Auth cookie cleared');
    
    // Simply destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Session destruction error:", err);
        return res.status(500).json({ message: "Error during logout" });
      }
      
      console.log('✅ Logout successful - Session destroyed');
      return res.status(200).json({ message: "Logout successful" });
    });
  });
  
  app.get("/api/auth/status", async (req, res) => {
    try {
      console.log('🔍 Auth status check');
      
      // Vérifier d'abord la session
      if (req.session.token) {
        console.log('✅ Session token found');
        return res.status(200).json({ isLoggedIn: true });
      }
      
      // Si pas de token dans la session, vérifier les cookies directs
      const authTokenCookie = req.cookies.auth_token;
      if (authTokenCookie) {
        console.log('🍪 Direct cookie token found, restoring session');
        // Restaurer le token dans la session pour les prochaines requêtes
        req.session.token = authTokenCookie;
        return res.status(200).json({ isLoggedIn: true });
      }
      
      console.log('❌ No auth token found in session or cookies');
      return res.status(200).json({ isLoggedIn: false });
    } catch (error) {
      console.error("❌ Auth status error:", error);
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
    console.log("📥 PUT /api/settings - Received request with body:", req.body);
    try {
      const updatedSettings = req.body;
      
      console.log("📋 Validating settings data:", updatedSettings);
      const validatedData = insertSettingsSchema.partial().parse(updatedSettings);
      console.log("✅ Settings data validation passed");
      
      console.log("💾 Attempting to update settings in database with:", validatedData);
      try {
        const settings = await storage.updateSettings(validatedData);
        console.log("✅ Settings successfully updated in database:", settings);
        return res.status(200).json(settings);
      } catch (dbError: any) {
        console.error("❌ DATABASE ERROR during settings update:", dbError);
        console.error("Error details:", { 
          message: dbError.message || "Unknown error", 
          code: dbError.code || "UNKNOWN", 
          stack: dbError.stack || "No stack trace" 
        });
        return res.status(500).json({ 
          message: "Database error while updating settings", 
          error: dbError.message || "Unknown database error",
          code: dbError.code || "UNKNOWN"
        });
      }
    } catch (error: any) {
      console.error("❌ SETTINGS UPDATE ERROR:", error);
      
      if (error instanceof ZodError) {
        console.error("📋 Validation error details:", error.errors);
        return res.status(400).json({ 
          message: "Invalid settings data", 
          errors: error.errors 
        });
      }
      
      console.error("⚠️ Unexpected error type:", error.constructor?.name || "Unknown");
      return res.status(500).json({ 
        message: "Error updating settings",
        error: error.message || "Unknown error"
      });
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
    const day = parseInt(req.params.day);
    console.log(`📥 PUT /api/content/${day} - Received request with body:`, req.body);
    
    try {
      if (isNaN(day) || day < 1 || day > 30) {
        console.log(`❌ Invalid day parameter: ${day}`);
        return res.status(400).json({ message: "Invalid day parameter. Must be between 1 and 30." });
      }
      
      const { title, type, content: contentData } = req.body;
      console.log(`📋 Processing content update for day ${day}:`, { title, type, contentDataKeys: Object.keys(contentData || {}) });
      
      // Validation steps with detailed logging
      console.log(`📋 Validating content type: ${type}`);
      const validatedType = contentTypeSchema.parse(type);
      
      console.log(`📋 Validating content data for type ${type}:`, contentData);
      contentDataSchema.parse(contentData);
      console.log("✅ Content data validation passed");
      
      // Database update with error handling
      console.log(`💾 Attempting to update content in database for day ${day}`);
      try {
        const updatedContent = await storage.updateContent(day, {
          title,
          type: validatedType,
          content: contentData
        });
        console.log(`✅ Content successfully updated for day ${day}:`, updatedContent);
        return res.status(200).json(updatedContent);
      } catch (dbError: any) {
        console.error(`❌ DATABASE ERROR during content update for day ${day}:`, dbError);
        console.error("Error details:", { 
          message: dbError.message || "Unknown error", 
          code: dbError.code || "UNKNOWN", 
          stack: dbError.stack || "No stack trace" 
        });
        return res.status(500).json({ 
          message: "Database error while updating content", 
          error: dbError.message || "Unknown database error",
          code: dbError.code || "UNKNOWN"
        });
      }
    } catch (error: any) {
      console.error(`❌ CONTENT UPDATE ERROR for day ${day}:`, error);
      
      if (error instanceof ZodError) {
        console.error("📋 Validation error details:", error.errors);
        return res.status(400).json({ 
          message: "Invalid content data", 
          errors: error.errors 
        });
      }
      
      console.error("⚠️ Unexpected error type:", error.constructor?.name || "Unknown");
      return res.status(500).json({ 
        message: "Error updating content",
        error: error.message || "Unknown error"
      });
    }
  });
  
  // Route pour supprimer un contenu
  app.delete("/api/content/:day", requireAuth, async (req, res) => {
    try {
      const day = parseInt(req.params.day);
      
      if (isNaN(day) || day < 1 || day > 30) {
        return res.status(400).json({ message: "Invalid day parameter. Must be between 1 and 30." });
      }
      
      await storage.deleteContent(day);
      
      return res.status(200).json({ message: `Content for day ${day} deleted successfully` });
    } catch (error) {
      console.error(`Delete content error for day ${req.params.day}:`, error);
      return res.status(500).json({ message: "Error deleting content" });
    }
  });

  // Diagnostic route to check database connection and permissions
  app.get("/api/diagnostic", async (req, res) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const diagnosticInfo: any = {
      environment: process.env.NODE_ENV || 'production',
      storageType: 'PostgreSQL',
      workingDirectory: process.cwd(),
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        version: null,
        canWrite: false,
        lastError: null
      }
    };
    
    // Tester la connexion à la base de données
    try {
      const client = await pool.connect();
      try {
        // Vérifier la connexion
        const res = await client.query('SELECT version(), current_user, current_database()');
        diagnosticInfo.database.connected = true;
        diagnosticInfo.database.version = res.rows[0].version;
        diagnosticInfo.database.user = res.rows[0].current_user;
        diagnosticInfo.database.name = res.rows[0].current_database;
        
        // Tester les permissions d'écriture
        try {
          await client.query(`
            CREATE TEMPORARY TABLE IF NOT EXISTS perm_test (id serial, test text);
            INSERT INTO perm_test (test) VALUES ('Diagnostic test');
            SELECT * FROM perm_test;
            DROP TABLE IF EXISTS perm_test;
          `);
          diagnosticInfo.database.canWrite = true;
        } catch (writeErr: any) {
          diagnosticInfo.database.canWrite = false;
          diagnosticInfo.database.lastError = {
            message: writeErr.message,
            code: writeErr.code,
            detail: writeErr.detail
          };
        }
      } finally {
        client.release();
      }
    } catch (err: any) {
      diagnosticInfo.database.lastError = {
        message: err.message,
        code: err.code,
        detail: err.detail
      };
    }
    
    return res.status(200).json(diagnosticInfo);
  });

  // Initialize database on startup
  await initializeDatabase();
  
  const httpServer = createServer(app);
  return httpServer;
}

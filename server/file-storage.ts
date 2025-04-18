import fs from 'fs';
import path from 'path';
import { Content, InsertContent, Settings, InsertSettings, Session, InsertSession, User, InsertUser } from '@shared/schema';
import { IStorage } from './storage';

// Chemins pour les fichiers de stockage
const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Assurez-vous que le répertoire data existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`📁 Created data directory at ${DATA_DIR}`);
}

// Types pour les données en mémoire
interface FileData {
  settings?: Settings;
  content: Content[];
  users: User[];
  sessions: Session[];
  lastIds: {
    content: number;
    users: number;
    sessions: number;
  };
}

// Initialisation des données
const initialData: FileData = {
  content: [],
  users: [],
  sessions: [],
  lastIds: {
    content: 0,
    users: 0,
    sessions: 0
  }
};

// Fonction pour charger les données depuis les fichiers
function loadData(): FileData {
  try {
    const data: FileData = { ...initialData };
    
    // Charge les paramètres
    if (fs.existsSync(SETTINGS_FILE)) {
      data.settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      console.log('📂 Settings loaded from file');
    }
    
    // Charge le contenu
    if (fs.existsSync(CONTENT_FILE)) {
      data.content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
      console.log('📂 Content loaded from file');
      // Mise à jour du dernier ID de contenu
      if (data.content.length > 0) {
        data.lastIds.content = Math.max(...data.content.map(c => c.id));
      }
    }
    
    // Charge les utilisateurs
    if (fs.existsSync(USERS_FILE)) {
      data.users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      console.log('📂 Users loaded from file');
      // Mise à jour du dernier ID utilisateur
      if (data.users.length > 0) {
        data.lastIds.users = Math.max(...data.users.map(u => u.id));
      }
    }
    
    // Charge les sessions
    if (fs.existsSync(SESSIONS_FILE)) {
      data.sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
      console.log('📂 Sessions loaded from file');
      // Mise à jour du dernier ID de session
      if (data.sessions.length > 0) {
        data.lastIds.sessions = Math.max(...data.sessions.map(s => s.id));
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error loading data from files:', error);
    return { ...initialData };
  }
}

// Fonction pour sauvegarder les données dans les fichiers
function saveSettings(settings: Settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('💾 Settings saved to file');
  } catch (error) {
    console.error('❌ Error saving settings to file:', error);
    throw error;
  }
}

function saveContent(content: Content[]) {
  try {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
    console.log('💾 Content saved to file');
  } catch (error) {
    console.error('❌ Error saving content to file:', error);
    throw error;
  }
}

function saveUsers(users: User[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('💾 Users saved to file');
  } catch (error) {
    console.error('❌ Error saving users to file:', error);
    throw error;
  }
}

function saveSessions(sessions: Session[]) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    console.log('💾 Sessions saved to file');
  } catch (error) {
    console.error('❌ Error saving sessions to file:', error);
    throw error;
  }
}

// Implémentation de l'interface IStorage avec stockage dans des fichiers
export class FileStorage implements IStorage {
  private data: FileData;
  readonly sessionStore: any;
  
  constructor() {
    this.data = loadData();
    this.sessionStore = {
      // Stub de session store compatible avec express-session
      // Dans une implémentation réelle, ce serait un vrai store
      get: (sid: string, callback: Function) => {
        const session = this.data.sessions.find(s => s.token === sid);
        callback(null, session || null);
      },
      set: (sid: string, session: any, callback: Function) => {
        // La gestion des sessions est faite via les méthodes de l'interface
        callback();
      },
      destroy: (sid: string, callback: Function) => {
        // La suppression de session est faite via les méthodes de l'interface
        callback();
      }
    };
    
    // Initialisation des paramètres si nécessaire
    if (!this.data.settings) {
      this.initializeSettings().then(settings => {
        console.log('📝 Settings initialized');
      }).catch(error => {
        console.error('❌ Error initializing settings:', error);
      });
    }
  }
  
  // Méthodes pour les utilisateurs
  async getUser(id: number): Promise<User | undefined> {
    console.log(`📖 [FileStorage] getUser - Fetching user with ID ${id}`);
    return this.data.users.find(u => u.id === id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log(`📖 [FileStorage] getUserByUsername - Fetching user with username ${username}`);
    return this.data.users.find(u => u.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    console.log(`📝 [FileStorage] createUser - Creating new user with username ${insertUser.username}`);
    const id = ++this.data.lastIds.users;
    const user: User = { id, ...insertUser };
    this.data.users.push(user);
    saveUsers(this.data.users);
    return user;
  }
  
  // Méthodes pour les paramètres
  async getSettings(): Promise<Settings | undefined> {
    console.log(`📖 [FileStorage] getSettings - Fetching settings`);
    return this.data.settings;
  }
  
  async updateSettings(updatedSettings: Partial<InsertSettings>): Promise<Settings> {
    console.log(`📝 [FileStorage] updateSettings - Updating settings`, updatedSettings);
    try {
      if (this.data.settings) {
        const now = new Date().toISOString();
        const settings: Settings = {
          ...this.data.settings,
          ...updatedSettings,
          updatedAt: now
        };
        this.data.settings = settings;
        saveSettings(settings);
        return settings;
      } else {
        return this.initializeSettings();
      }
    } catch (error) {
      console.error('❌ [FileStorage] updateSettings - Error:', error);
      throw error;
    }
  }
  
  async initializeSettings(): Promise<Settings> {
    console.log(`📝 [FileStorage] initializeSettings - Creating default settings`);
    const now = new Date().toISOString();
    const defaultSettings: Settings = {
      id: 1,
      titleColor: "#1E3A8A",
      starColor: "#FCD34D",
      starBorderColor: "#F59E0B",
      backgroundImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=2048&q=80",
      totalDays: 19,
      updatedAt: now
    };
    
    this.data.settings = defaultSettings;
    saveSettings(defaultSettings);
    return defaultSettings;
  }
  
  // Méthodes pour le contenu
  async getContent(day: number): Promise<Content | undefined> {
    console.log(`📖 [FileStorage] getContent - Fetching content for day ${day}`);
    return this.data.content.find(c => c.day === day);
  }
  
  async getAllContent(): Promise<Content[]> {
    console.log(`📖 [FileStorage] getAllContent - Fetching all content`);
    return [...this.data.content].sort((a, b) => a.day - b.day);
  }
  
  async updateContent(day: number, contentData: Partial<InsertContent>): Promise<Content> {
    console.log(`📝 [FileStorage] updateContent - Updating content for day ${day}`, contentData);
    try {
      const now = new Date().toISOString();
      const existingContent = this.data.content.find(c => c.day === day);
      
      if (existingContent) {
        // Mise à jour du contenu existant
        const updatedContent: Content = {
          ...existingContent,
          ...contentData,
          updatedAt: now
        };
        
        // Remplace le contenu existant dans le tableau
        const index = this.data.content.findIndex(c => c.day === day);
        this.data.content[index] = updatedContent;
        
        saveContent(this.data.content);
        return updatedContent;
      } else {
        // Création d'un nouveau contenu
        const id = ++this.data.lastIds.content;
        const newContent: Content = {
          id,
          day,
          title: contentData.title || `Day ${day}`,
          type: contentData.type || "text",
          content: contentData.content || { text: "" },
          updatedAt: now
        };
        
        this.data.content.push(newContent);
        saveContent(this.data.content);
        return newContent;
      }
    } catch (error) {
      console.error(`❌ [FileStorage] updateContent - Error updating content for day ${day}:`, error);
      throw error;
    }
  }
  
  async deleteContent(day: number): Promise<void> {
    console.log(`🗑️ [FileStorage] deleteContent - Deleting content for day ${day}`);
    try {
      const index = this.data.content.findIndex(c => c.day === day);
      
      if (index !== -1) {
        this.data.content.splice(index, 1);
        saveContent(this.data.content);
        console.log(`✅ Content for day ${day} deleted successfully`);
      } else {
        console.log(`⚠️ No content found for day ${day}`);
      }
    } catch (error) {
      console.error(`❌ [FileStorage] deleteContent - Error deleting content for day ${day}:`, error);
      throw error;
    }
  }
  
  // Méthodes pour les sessions
  async createSession(session: InsertSession): Promise<Session> {
    console.log(`📝 [FileStorage] createSession - Creating new session`);
    const id = ++this.data.lastIds.sessions;
    const newSession: Session = { id, ...session };
    this.data.sessions.push(newSession);
    saveSessions(this.data.sessions);
    return newSession;
  }
  
  async getSessionByToken(token: string): Promise<Session | undefined> {
    console.log(`📖 [FileStorage] getSessionByToken - Fetching session with token ${token}`);
    return this.data.sessions.find(s => s.token === token);
  }
  
  async deleteSession(token: string): Promise<void> {
    console.log(`🗑️ [FileStorage] deleteSession - Deleting session with token ${token}`);
    const index = this.data.sessions.findIndex(s => s.token === token);
    
    if (index !== -1) {
      this.data.sessions.splice(index, 1);
      saveSessions(this.data.sessions);
      console.log(`✅ Session with token ${token} deleted successfully`);
    } else {
      console.log(`⚠️ No session found with token ${token}`);
    }
  }
  
  async cleanExpiredSessions(): Promise<void> {
    console.log(`🧹 [FileStorage] cleanExpiredSessions - Cleaning expired sessions`);
    const now = new Date().toISOString();
    const validSessions = this.data.sessions.filter(s => s.expiresAt > now);
    
    if (validSessions.length < this.data.sessions.length) {
      this.data.sessions = validSessions;
      saveSessions(this.data.sessions);
      console.log(`✅ Expired sessions cleaned successfully`);
    } else {
      console.log(`ℹ️ No expired sessions found`);
    }
  }
}

export const fileStorage = new FileStorage();
import { pool, db } from './db';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

export async function createTables() {
  try {
    console.log('Initializing database tables...');
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created or already exists');
    
    // Create settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        title_color VARCHAR(255) NOT NULL DEFAULT '#1E3A8A',
        star_color VARCHAR(255) NOT NULL DEFAULT '#FCD34D',
        star_border_color VARCHAR(255) NOT NULL DEFAULT '#F59E0B',
        background_image TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=2048&q=80',
        total_days INTEGER NOT NULL DEFAULT 19,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Settings table created or already exists');
    
    // Create content table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        day INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        content JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(day)
      )
    `);
    console.log('Content table created or already exists');
    
    // Create sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) NOT NULL UNIQUE,
        user_id INTEGER REFERENCES users(id),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Sessions table created or already exists');
    
    // Compter le nombre de lignes dans la table settings
    const settingsResult = await pool.query('SELECT COUNT(*) FROM settings');
    const settingsCount = parseInt(settingsResult.rows[0].count);
    
    // Insérer des réglages par défaut si la table est vide
    if (settingsCount === 0) {
      await pool.query(`
        INSERT INTO settings (title_color, star_color, star_border_color, background_image, total_days)
        VALUES ('#1E3A8A', '#FCD34D', '#F59E0B', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=2048&q=80', 19)
      `);
      console.log('Default settings inserted');
    }
    
    // Compter le nombre d'utilisateurs
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    const usersCount = parseInt(usersResult.rows[0].count);
    
    // Insérer un utilisateur admin par défaut si la table est vide
    if (usersCount === 0) {
      await pool.query(`
        INSERT INTO users (username, password)
        VALUES ('admin', '5de612ae71249a63961e66df862b8eb83471ce4c941929dd0bd44491d7d4f669.1af7138d98a45616b4c1e89dfaa75432')
      `);
      console.log('Default admin user inserted');
    }
    
    console.log('Database initialization complete');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
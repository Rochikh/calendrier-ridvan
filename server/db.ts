import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { sqlLogger } from './db-logger';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Activer les logs détaillés pour Postgres
const connectionString = process.env.DATABASE_URL;
console.log(`🔌 Database connection string format: ${connectionString.split(':')[0]}://*****:*****@${connectionString.split('@')[1]}`);

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

// Vérifier la connectivité à la base de données
pool.on('error', (err: Error & { code?: string }) => {
  console.error('❌ DATABASE POOL ERROR:', err);
  console.error('Error details:', {
    message: err.message,
    code: err.code || 'UNKNOWN',
    stack: err.stack || 'No stack trace available'
  });
});

// Vérifier la connexion au démarrage
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW()');
      console.log(`✅ Database connection successful: ${res.rows[0].now}`);
      
      // Tester les permissions
      console.log('🔍 Testing database write permissions...');
      try {
        // Essayer d'écrire dans une table temporaire
        await client.query(`
          CREATE TEMPORARY TABLE IF NOT EXISTS perm_test (id serial, test text);
          INSERT INTO perm_test (test) VALUES ('Connection test');
          SELECT * FROM perm_test;
          DROP TABLE IF EXISTS perm_test;
        `);
        console.log('✅ Database write permission test successful');
      } catch (writeErr: unknown) {
        const err = writeErr as Error & { code?: string };
        console.error('❌ DATABASE WRITE PERMISSION ERROR:', err);
        console.error('Error details:', {
          message: err.message || 'Unknown error',
          code: err.code || 'UNKNOWN',
          stack: err.stack || 'No stack trace available'
        });
      }
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const error = err as Error & { code?: string };
    console.error('❌ DATABASE CONNECTION ERROR:', error);
    console.error('Error details:', {
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN',
      stack: error.stack || 'No stack trace available'
    });
  }
}

// Appeler le test de connexion
testDatabaseConnection().catch(console.error);

export const db = drizzle(pool, { schema, logger: sqlLogger });

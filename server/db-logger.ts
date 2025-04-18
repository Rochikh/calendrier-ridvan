import { Logger } from "drizzle-orm";

/**
 * Logger pour Drizzle ORM pour tracer les requêtes SQL
 */
export class DetailedLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    try {
      const safeParams = params.map(param => {
        if (typeof param === 'object' && param !== null) {
          try {
            // Tente de convertir les objets en JSON
            return JSON.stringify(param);
          } catch (e) {
            return `[Complex Object: ${typeof param}]`;
          }
        }
        return param;
      });
      
      console.log(`
📊 ====== SQL QUERY EXECUTION ======
🔍 QUERY: ${query}
📦 PARAMS: ${JSON.stringify(safeParams, null, 2)}
⏱️ TIME: ${new Date().toISOString()}
==================================== 
      `);
    } catch (err) {
      console.error('❌ Error logging SQL query:', err);
      console.log(`📊 SQL QUERY (SAFE): ${query}`);
    }
  }
}

export const sqlLogger = new DetailedLogger();
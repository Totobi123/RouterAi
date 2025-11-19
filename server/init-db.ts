import { db } from "./db";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  if (!db) {
    console.log("Database not configured, skipping initialization");
    return;
  }

  try {
    console.log("Checking database tables...");
    
    // Check if tables exist by querying information_schema
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'chat_sessions', 'messages', 'settings')
    `);
    
    const existingTables = result.rows.map((row: any) => row.table_name);
    const requiredTables = ['users', 'chat_sessions', 'messages', 'settings'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`Missing tables: ${missingTables.join(', ')}`);
      console.log("Creating database tables...");
      
      // Create tables
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          chat_session_id VARCHAR NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          audio_base64 TEXT
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS settings (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          openrouter_api_key TEXT,
          murf_api_key TEXT,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log("Database tables created successfully!");
    } else {
      console.log("All required tables exist");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

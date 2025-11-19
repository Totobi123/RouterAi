import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

let db: ReturnType<typeof drizzle> | null = null;

console.log("DATABASE_URL value:", process.env.DATABASE_URL ? "exists (length: " + process.env.DATABASE_URL.length + ")" : "not set");

if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0) {
  console.log("Initializing database connection...");
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    console.log("Database connection initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
} else {
  console.log("DATABASE_URL not configured (either not set or empty)");
}

export { db };

/**
 * Database Initialization Script
 * Creates necessary tables if they don't exist
 * Run this once during deployment
 */

import { db, pool } from "./index.js";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    console.log("🔧 Initializing database...");

    // Create session table
    await db.execute(
      sql`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL,
          "sess" jsonb NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        );
      `
    );

    // Create index on expire column
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`
    );

    console.log("✅ Session table created/verified successfully");

    return true;
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

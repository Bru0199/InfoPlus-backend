import { db, pool } from "./index.js";
import { sql } from "drizzle-orm";
import { logger } from "../utils/logger.js";

export async function initializeDatabase() {
  try {
    logger.db("Initializing database...");

    await db.execute(
      sql`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL,
          "sess" jsonb NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        );
      `,
    );

    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`,
    );

    logger.success("Session table created/verified successfully");

    return true;
  } catch (error) {
    logger.error("Database initialization error:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

// Global error handler for uncaught exceptions
console.log("⚙️ [server.ts] Starting server initialization...");

process.on("uncaughtException", (err: any) => {
  console.error("❌ UNCAUGHT EXCEPTION:");
  if (err instanceof Error) {
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
  } else if (typeof err === "object" && err !== null) {
    console.error(JSON.stringify(err, null, 2));
  } else {
    console.error(String(err));
  }
  process.exit(1);
});

process.on("unhandledRejection", (reason: any) => {
  console.error("❌ UNHANDLED REJECTION:");
  if (reason instanceof Error) {
    console.error("Message:", reason.message);
    console.error("Stack:", reason.stack);
  } else if (typeof reason === "object" && reason !== null) {
    console.error(JSON.stringify(reason, null, 2));
  } else {
    console.error(String(reason));
  }
  process.exit(1);
});

console.log("⚙️ [server.ts] Importing modules...");

import { app } from "./app.js";
import { env } from "./env.js";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

console.log("⚙️ [server.ts] Modules imported successfully!");

const port = env.PORT ?? 3000; // default to 3000 if PORT not set

console.log("📋 Server configuration:", {
  port,
  env: process.env.NODE_ENV,
  backend_url: process.env.BACKEND_URL,
  frontend_url: process.env.FRONTEND_URL,
});

/**
 * Initialize database tables
 */
async function initializeDatabaseTables(): Promise<void> {
  try {
    console.log("🔧 Initializing database tables...");

    // Migration 0001: Session table
    try {
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
      console.log("✅ Session table created/verified");
    } catch (tableErr) {
      console.warn("⚠️ Session table creation warning:", tableErr);
    }

    // Create index on expire column for performance
    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`
      );
      console.log("✅ Session expire index created/verified");
    } catch (indexErr) {
      console.warn("⚠️ Session index creation warning:", indexErr);
    }

    // Migration 0002: Core tables (users, conversations, messages)
    try {
      await db.execute(
        sql`
          CREATE TABLE IF NOT EXISTS "users" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "email" text NOT NULL UNIQUE,
            "name" text,
            "image" text,
            "provider" text NOT NULL,
            "provider_id" text NOT NULL UNIQUE,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `
      );
      console.log("✅ Users table created/verified");
    } catch (err) {
      console.warn("⚠️ Users table creation warning:", err);
    }

    try {
      await db.execute(
        sql`
          CREATE TABLE IF NOT EXISTS "conversations" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "title" text DEFAULT 'New Chat',
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL
          );
        `
      );
      console.log("✅ Conversations table created/verified");
    } catch (err) {
      console.warn("⚠️ Conversations table creation warning:", err);
    }

    try {
      await db.execute(
        sql`
          CREATE TABLE IF NOT EXISTS "messages" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
            "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "role" text NOT NULL,
            "content" text NOT NULL,
            "tool_calls" jsonb,
            "tool_result" jsonb,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `
      );
      console.log("✅ Messages table created/verified");
    } catch (err) {
      console.warn("⚠️ Messages table creation warning:", err);
    }

    // Create indexes
    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "idx_conversations_user_id" ON "conversations"("user_id");`
      );
      console.log("✅ Conversations user_id index created/verified");
    } catch (err) {
      console.warn("⚠️ Conversations index creation warning:", err);
    }

    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages"("conversation_id");`
      );
      console.log("✅ Messages conversation_id index created/verified");
    } catch (err) {
      console.warn("⚠️ Messages index creation warning:", err);
    }

    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "idx_messages_user_id" ON "messages"("user_id");`
      );
      console.log("✅ Messages user_id index created/verified");
    } catch (err) {
      console.warn("⚠️ Messages index creation warning:", err);
    }

    console.log("✅ Database tables initialized successfully.");
  } catch (error) {
    console.error("❌ Database initialization error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Verify database connection with retries
 */
async function verifyDatabaseConnection(
  retries = 5,
  delay = 2000, // 2 seconds
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await db.execute(sql`SELECT 1`);
      console.log("✅ Database connection verified successfully.");
      return; // success
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(
        `⚠️ Database connection attempt ${attempt} failed: ${errorMsg}`,
      );
      if (attempt === retries) {
        throw new Error(`❌ Database connection failed after ${retries} retries: ${errorMsg}`);
      }
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Start the server
 */
async function startServer() {
  try {
    console.log("🔌 Verifying database connection...");
    await verifyDatabaseConnection();

    console.log("🔧 Setting up database...");
    await initializeDatabaseTables();

    app.listen(port, () => {
      console.log(`
🚀 Server is running!
📡 Mode: ${env.NODE_ENV}
🔗 URL: http://localhost:${port}
`);
    });
  } catch (error: any) {
    if (error instanceof Error) {
      console.error("❌ Server startup error:", error.message);
      if (error.stack) console.error("Stack trace:", error.stack);
    } else if (typeof error === 'object' && error !== null) {
      console.error("❌ Server startup error:", JSON.stringify(error, null, 2));
    } else {
      console.error("❌ Server startup error:", String(error));
    }
    process.exit(1); // Stop server if DB cannot be reached
  }
}

// Only start server if not in serverless environment (like Vercel)
if (process.env.VERCEL !== "1") {
  startServer().catch((err: any) => {
    if (err instanceof Error) {
      console.error("❌ Fatal Error:", err.message);
      console.error("Stack:", err.stack);
    } else if (typeof err === 'object' && err !== null) {
      console.error("❌ Fatal Error:", JSON.stringify(err, null, 2));
    } else {
      console.error("❌ Fatal Error:", String(err));
    }
    process.exit(1);
  });
}

// Export for Vercel serverless
export default app;

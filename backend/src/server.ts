process.on("uncaughtException", (err: any) => {
  logger.error("UNCAUGHT EXCEPTION:");
  if (err instanceof Error) {
    logger.error("Message:", err.message);
    logger.error("Stack:", err.stack);
  } else if (typeof err === "object" && err !== null) {
    logger.error(JSON.stringify(err, null, 2));
  } else {
    logger.error(String(err));
  }
  process.exit(1);
});

process.on("unhandledRejection", (reason: any) => {
  logger.error("UNHANDLED REJECTION:");
  if (reason instanceof Error) {
    logger.error("Message:", reason.message);
    logger.error("Stack:", reason.stack);
  } else if (typeof reason === "object" && reason !== null) {
    logger.error(JSON.stringify(reason, null, 2));
  } else {
    logger.error(String(reason));
  }
  process.exit(1);
});

import { app } from "./app.js";
import { env } from "./env.js";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";
import { logger } from "./utils/logger.js";

const port = env.PORT ?? 3000;

logger.info("Server configuration:", {
  port,
  env: process.env.NODE_ENV,
  backend_url: process.env.BACKEND_URL,
  frontend_url: process.env.FRONTEND_URL,
});

async function initializeDatabaseTables(): Promise<void> {
  try {
    logger.db("Initializing database tables...");

    try {
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
      logger.db("Session table created/verified");
    } catch (tableErr) {
      logger.warn("Session table creation warning:", tableErr);
    }

    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`,
      );
      logger.db("Session expire index created/verified");
    } catch (indexErr) {
      logger.warn("Session index creation warning:", indexErr);
    }

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
        `,
      );
      logger.db("Users table created/verified");
    } catch (err) {
      logger.warn("Users table creation warning:", err);
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
        `,
      );
      logger.db("Conversations table created/verified");
    } catch (err) {
      logger.warn("Conversations table creation warning:", err);
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
        `,
      );
      logger.db("Messages table created/verified");
    } catch (err) {
      logger.warn("Messages table creation warning:", err);
    }

    // Create indexes
    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "idx_conversations_user_id" ON "conversations"("user_id");`,
      );
      logger.db("Conversations user_id index created/verified");
    } catch (err) {
      logger.warn("Conversations index creation warning:", err);
    }

    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages"("conversation_id");`,
      );
      logger.db("Messages conversation_id index created/verified");
    } catch (err) {
      logger.warn("Messages index creation warning:", err);
    }

    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "idx_messages_user_id" ON "messages"("user_id");`,
      );
      logger.db("Messages user_id index created/verified");
    } catch (err) {
      logger.warn("Messages index creation warning:", err);
    }

    logger.success("Database tables initialized successfully.");
  } catch (error) {
    logger.error(
      "Database initialization error:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

async function verifyDatabaseConnection(
  retries = 5,
  delay = 2000,
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await db.execute(sql`SELECT 1`);
      logger.success("Database connection verified successfully.");
      return;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.warn(
        `Database connection attempt ${attempt} failed: ${errorMsg}`,
      );
      if (attempt === retries) {
        throw new Error(
          `Database connection failed after ${retries} retries: ${errorMsg}`,
        );
      }
      logger.info(`Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function startServer() {
  try {
    logger.db("Setting up database...");
    await initializeDatabaseTables();

    app.listen(port, () => {
      logger.success(`
🚀 Server is running!
📡 Mode: ${env.NODE_ENV}
🔗 URL: http://localhost:${port}
`);
    });
  } catch (error: any) {
    if (error instanceof Error) {
      logger.error("Server startup error:", error.message);
      if (error.stack) logger.error("Stack trace:", error.stack);
    } else if (typeof error === "object" && error !== null) {
      logger.error("Server startup error:", JSON.stringify(error, null, 2));
    } else {
      logger.error("Server startup error:", String(error));
    }
    process.exit(1); // Stop server if DB cannot be reached
  }
}

// Only start server if not in serverless environment (like Vercel)
if (process.env.VERCEL !== "1") {
  startServer().catch((err: any) => {
    if (err instanceof Error) {
      logger.error("Fatal Error:", err.message);
      logger.error("Stack:", err.stack);
    } else if (typeof err === "object" && err !== null) {
      logger.error("Fatal Error:", JSON.stringify(err, null, 2));
    } else {
      logger.error("Fatal Error:", String(err));
    }
    process.exit(1);
  });
}

export default app;

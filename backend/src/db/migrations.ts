import { db } from "./index.js";
import { sql } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import { ERROR_MESSAGES } from "../constants/index.js";

async function createSessionTable(): Promise<void> {
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
  } catch (error) {
    logger.warn("Session table creation warning:", error);
  }
}

async function createSessionIndex(): Promise<void> {
  try {
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`,
    );
    logger.db("Session expire index created/verified");
  } catch (error) {
    logger.warn("Session index creation warning:", error);
  }
}

async function createUsersTable(): Promise<void> {
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
  } catch (error) {
    logger.warn("Users table creation warning:", error);
  }
}

async function createConversationsTable(): Promise<void> {
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
  } catch (error) {
    logger.warn("Conversations table creation warning:", error);
  }
}

async function createMessagesTable(): Promise<void> {
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
  } catch (error) {
    logger.warn("Messages table creation warning:", error);
  }
}

async function createIndexes(): Promise<void> {
  const indexes = [
    {
      name: "idx_conversations_user_id",
      query: sql`CREATE INDEX IF NOT EXISTS "idx_conversations_user_id" ON "conversations"("user_id");`,
    },
    {
      name: "idx_messages_conversation_id",
      query: sql`CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages"("conversation_id");`,
    },
    {
      name: "idx_messages_user_id",
      query: sql`CREATE INDEX IF NOT EXISTS "idx_messages_user_id" ON "messages"("user_id");`,
    },
  ];

  for (const index of indexes) {
    try {
      await db.execute(index.query);
      logger.db(`Index ${index.name} created/verified`);
    } catch (error) {
      logger.warn(`Index ${index.name} creation warning:`, error);
    }
  }
}

/**
 * Initialize all database tables
 */
export async function initializeDatabaseTables(): Promise<void> {
  try {
    logger.db("Initializing database tables...");

    // Create tables
    await createSessionTable();
    await createSessionIndex();
    await createUsersTable();
    await createConversationsTable();
    await createMessagesTable();

    // Create indexes
    await createIndexes();

    logger.success("Database tables initialized successfully");
  } catch (error) {
    logger.error(ERROR_MESSAGES.DB.INIT_FAILED, error);
    throw error;
  }
}

export async function up(db: any) {
  // Create users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" text NOT NULL UNIQUE,
      "name" text,
      "image" text,
      "provider" text NOT NULL,
      "provider_id" text NOT NULL UNIQUE,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log("✅ Users table created successfully");

  // Create conversations table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "conversations" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "title" text DEFAULT 'New Chat',
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log("✅ Conversations table created successfully");

  // Create messages table
  await db.execute(`
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
  `);
  console.log("✅ Messages table created successfully");

  // Create indexes for better query performance
  await db.execute(`
    CREATE INDEX IF NOT EXISTS "idx_conversations_user_id" ON "conversations"("user_id");
  `);
  console.log("✅ Conversations user_id index created");

  await db.execute(`
    CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages"("conversation_id");
  `);
  console.log("✅ Messages conversation_id index created");

  await db.execute(`
    CREATE INDEX IF NOT EXISTS "idx_messages_user_id" ON "messages"("user_id");
  `);
  console.log("✅ Messages user_id index created");
}

export async function down(db: any) {
  // Drop tables in reverse order (respecting foreign keys)
  await db.execute(`DROP TABLE IF NOT EXISTS "messages" CASCADE;`);
  await db.execute(`DROP TABLE IF NOT EXISTS "conversations" CASCADE;`);
  await db.execute(`DROP TABLE IF NOT EXISTS "users" CASCADE;`);
  console.log("❌ Core tables dropped");
}

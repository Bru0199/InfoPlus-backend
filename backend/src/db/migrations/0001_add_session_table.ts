import { pgTable, varchar, jsonb, timestamp, index, PrimaryKeyBuilder } from "drizzle-orm/pg-core";

export async function up(db: any) {
  // Create session table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL,
      "sess" jsonb NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    );
  `);

  // Create index on expire column for automatic cleanup
  await db.execute(`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `);

  console.log("✅ Session table created successfully");
}

export async function down(db: any) {
  // Drop session table
  await db.execute(`DROP TABLE IF NOT EXISTS "session" CASCADE;`);
  console.log("❌ Session table dropped");
}

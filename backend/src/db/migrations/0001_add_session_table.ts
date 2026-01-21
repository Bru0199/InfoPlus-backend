import {
  pgTable,
  varchar,
  jsonb,
  timestamp,
  index,
  PrimaryKeyBuilder,
} from "drizzle-orm/pg-core";
import { logger } from "../../utils/logger.js";

export async function up(db: any) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL,
      "sess" jsonb NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `);

  logger.success("Session table created successfully");
}

export async function down(db: any) {
  await db.execute(`DROP TABLE IF NOT EXISTS "session" CASCADE;`);
  logger.info("Session table dropped");
}

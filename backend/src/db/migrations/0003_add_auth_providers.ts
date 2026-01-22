import { logger } from "../../utils/logger.js";

export async function up(db: any) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "auth_providers" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "provider" text NOT NULL,
      "provider_user_id" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT auth_providers_provider_user_unique UNIQUE ("provider", "provider_user_id"),
      CONSTRAINT auth_providers_user_provider_unique UNIQUE ("user_id", "provider")
    );
  `);
  logger.success("auth_providers table created successfully");

  await db.execute(`
    INSERT INTO "auth_providers" ("user_id", "provider", "provider_user_id")
    SELECT u."id", u."provider", u."provider_id"
    FROM "users" u
    ON CONFLICT DO NOTHING;
  `);
  logger.success("auth_providers table backfilled from users");
}

export async function down(db: any) {
  await db.execute(`DROP TABLE IF EXISTS "auth_providers" CASCADE;`);
  logger.info("auth_providers table dropped");
}

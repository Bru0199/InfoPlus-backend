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

    // Create session table if it doesn't exist
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

import { app } from "./app.js";
import { env } from "./env.js";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

const port = env.PORT ?? 3000; // default to 3000 if PORT not set

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
    } catch (error) {
      console.warn(
        `⚠️ Database connection attempt ${attempt} failed: ${error}`,
      );
      if (attempt === retries) {
        throw new Error("❌ Database connection failed after retries.");
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

    app.listen(port, () => {
      console.log(`
🚀 Server is running!
📡 Mode: ${env.NODE_ENV}
🔗 URL: http://localhost:${port}
`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1); // Stop server if DB cannot be reached
  }
}

// Only start server if not in serverless environment (like Vercel)
if (process.env.VERCEL !== "1") {
  startServer();
}

// Export for Vercel serverless
export default app;

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "../env.js";

neonConfig.webSocketConstructor = ws;

if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export const pool = new Pool({ 
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool);

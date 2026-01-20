/**
 * Diagnostic Script - Check environment and setup
 * Run this to debug the server startup issue
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("🔍 Environment Diagnostics\n");

// Check if .env file exists
const fs = await import("fs");
const envPath = path.resolve(__dirname, "../.env");
console.log("1️⃣ .env File:");
console.log(`   Path: ${envPath}`);
console.log(`   Exists: ${fs.existsSync(envPath) ? "✅ YES" : "❌ NO"}`);

// Check required variables
console.log("\n2️⃣ Required Environment Variables:");
const required = [
  "NODE_ENV",
  "PORT",
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "OPENWEATHER_API_KEY",
  "EODHD_API_TOKEN",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "OPENROUTER_API_KEY",
  "SESSION_SECRET",
  "FRONTEND_URL",
  "BACKEND_URL",
];

const missing: string[] = [];
required.forEach((key) => {
  const value = process.env[key];
  if (value) {
    const display =
      key === "DATABASE_URL" || key.includes("SECRET")
        ? value.substring(0, 20) + "..."
        : value;
    console.log(`   ✅ ${key}: ${display}`);
  } else {
    console.log(`   ❌ ${key}: MISSING`);
    missing.push(key);
  }
});

if (missing.length > 0) {
  console.log(`\n❌ Missing ${missing.length} variable(s): ${missing.join(", ")}`);
  console.log("   Please add them to .env file");
} else {
  console.log("\n✅ All variables are set!");
}

// Test database connection
console.log("\n3️⃣ Testing Database Connection...");
try {
  const { Pool } = await import("@neondatabase/serverless");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query("SELECT NOW()");
  console.log(`   ✅ Database connected: ${result.rows[0].now}`);
  await pool.end();
} catch (err: any) {
  console.log(`   ❌ Database error: ${err.message}`);
}

console.log("\n✨ Diagnostics complete!");

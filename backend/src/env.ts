import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("4000").transform(Number),
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid connection string"),

  // Auth
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
  GITHUB_CLIENT_ID: z.string().min(1, "GitHub Client ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GitHub Client Secret is required"),

  // Tools
  OPENWEATHER_API_KEY: z.string().min(1, "OpenWeather API key is required"),
  EODHD_API_TOKEN: z.string().min(1, "Alpha Vantage API key is required"),


  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  OPENROUTER_API_KEY: z.string().min(1, "OpenAI API key is required"),
  
  SESSION_SECRET:z.string().min(1, "SessionSecret key is required"),

  FRONTEND_URL:z
    .string()
    .url("Frondend must be a valid connection string")
    .min(1, "Frontend URL is required")

});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;

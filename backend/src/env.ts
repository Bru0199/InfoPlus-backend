import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("4000").transform(Number),
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid connection string"),

  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
  GITHUB_CLIENT_ID: z.string().min(1, "GitHub Client ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GitHub Client Secret is required"),

  OPENWEATHER_API_KEY: z.string().min(1, "OpenWeather API key is required"),
  EODHD_API_TOKEN: z.string().min(1, "Alpha Vantage API key is required"),

  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  OPENROUTER_API_KEY: z.string().min(1, "OpenAI API key is required"),

  SESSION_SECRET: z.string().min(1, "SessionSecret key is required"),

  FRONTEND_URL: z
    .string()
    .url("Frondend must be a valid connection string")
    .min(1, "Frontend URL is required"),

  BACKEND_URL: z
    .string()
    .url("Backend URL must be a valid URL")
    .min(1, "Backend URL is required"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  logger.error("ENVIRONMENT VARIABLE VALIDATION ERROR");
  logger.error("Missing or invalid environment variables:");
  const errors = _env.error.flatten();
  logger.error(JSON.stringify(errors, null, 2));
  logger.error("\n📝 Required variables:");
  logger.error("  - NODE_ENV (development, production, test)");
  logger.error("  - PORT");
  logger.error("  - DATABASE_URL");
  logger.error("  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET");
  logger.error("  - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET");
  logger.error("  - OPENWEATHER_API_KEY");
  logger.error("  - EODHD_API_TOKEN");
  logger.error("  - GOOGLE_GENERATIVE_AI_API_KEY");
  logger.error("  - OPENROUTER_API_KEY");
  logger.error("  - SESSION_SECRET");
  logger.error("  - FRONTEND_URL");
  logger.error("  - BACKEND_URL");
  process.exit(1);
}

export const env = _env.data;

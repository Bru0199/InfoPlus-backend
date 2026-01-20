"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
var zod_1 = require("zod");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: zod_1.z.string().default("4000").transform(Number),
    DATABASE_URL: zod_1.z
        .string()
        .url("DATABASE_URL must be a valid connection string"),
    // Auth
    GOOGLE_CLIENT_ID: zod_1.z.string().min(1, "Google Client ID is required"),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().min(1, "Google Client Secret is required"),
    GITHUB_CLIENT_ID: zod_1.z.string().min(1, "GitHub Client ID is required"),
    GITHUB_CLIENT_SECRET: zod_1.z.string().min(1, "GitHub Client Secret is required"),
    // Tools
    OPENWEATHER_API_KEY: zod_1.z.string().min(1, "OpenWeather API key is required"),
    EODHD_API_TOKEN: zod_1.z.string().min(1, "Alpha Vantage API key is required"),
    GOOGLE_GENERATIVE_AI_API_KEY: zod_1.z.string().min(1, "OpenAI API key is required"),
    OPENROUTER_API_KEY: zod_1.z.string().min(1, "OpenAI API key is required"),
    SESSION_SECRET: zod_1.z.string().min(1, "SessionSecret key is required"),
    FRONTEND_URL: zod_1.z
        .string()
        .url("Frondend must be a valid connection string")
});
var _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    process.exit(1);
}
exports.env = _env.data;

/**
 * Express Application Configuration
 * Main entry point for API server
 */

import express from "express";
import passport from "./auth/passport.js";
import authRouter from "./auth/routes.js";
import chatRouter from "./chat/routes.js";
import { pool } from "./db/index.js";
import { env } from "./env.js";
import { isAuthenticated } from "./auth/middleware.js";
import { initializeDatabaseTables } from "./db/migrations.js";
import { configureCors, configureSession } from "./config/middleware.js";
import { logger } from "./utils/logger.js";
import { API_ROUTES } from "./constants/index.js";

// Initialize Express app
const app = express();

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

// Initialize database tables on app startup (needed for Vercel serverless)
initializeDatabaseTables().catch((err) => {
  logger.error("Failed to initialize database:", err);
  // Don't exit - let the app start anyway so Vercel can show logs
});

// ============================================================================
// PROXY & TRUST SETTINGS
// ============================================================================

// Trust reverse proxy (Vercel/Nginx) - CRITICAL for production cookies
app.set("trust proxy", 1);

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Session middleware - MUST come before Passport
app.use(configureSession(pool));

// Request logging middleware
app.use((req, res, next) => {
  logger.request(req.method, req.path, {
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated?.(),
    user: (req.user as any)?.email || null,
  });
  next();
});

// CORS middleware - MUST be before routes
const allowedOrigins = [
  env.FRONTEND_URL,
  "https://info-plus-frontend.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];
app.use(configureCors(allowedOrigins));

// Body parser middleware
app.use(express.json());

// ============================================================================
// AUTHENTICATION
// ============================================================================

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ============================================================================
// ROUTES
// ============================================================================

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "InfoPlus Backend API is running",
    version: "1.0.1",
    environment: env.NODE_ENV,
    endpoints: {
      health: API_ROUTES.HEALTH,
      auth: API_ROUTES.AUTH.BASE,
      chat: API_ROUTES.CHAT.BASE,
    },
  });
});

// API Routes
app.use(API_ROUTES.AUTH.BASE, authRouter);
app.use(API_ROUTES.CHAT.BASE, isAuthenticated, chatRouter);

// Health endpoint with session info
app.get(API_ROUTES.HEALTH, (req, res) => {
  res.status(200).json({
    status: "UP",
    user: req.user || null,
    session: {
      id: req.sessionID,
      exists: !!req.session,
      authenticated: req.isAuthenticated?.() || false,
    },
    environment: env.NODE_ENV,
  });
});

// Database connection test endpoint
app.get(API_ROUTES.DB_TEST, async (req, res) => {
  try {
    const { db } = await import("./db/index.js");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    res.status(200).json({ database: "Connected ✅" });
  } catch (error: any) {
    res.status(500).json({
      database: "Failed ❌",
      error: error.message,
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`, {
    query: req.query,
    headers: req.headers,
  });
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.path} not found`,
  });
});

app.use((err: any, req: any, res: any, next: any) => {
  logger.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

export { app };
export default app;

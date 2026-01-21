/**
 * Middleware Configuration
 * CORS, Session, and authentication setup
 */

import cors from "cors";
import session from "express-session";
import type { SessionOptions } from "express-session";
import pgSession from "connect-pg-simple";
import type { Pool } from "@neondatabase/serverless";
import { env } from "../env.js";
import { COOKIE_CONFIG, CORS_ALLOWED_PATHS, SESSION_CONFIG } from "../constants/index.js";
import { logger } from "../utils/logger.js";

/**
 * Configure CORS middleware
 */
export function configureCors(allowedOrigins: string[]) {
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        logger.info(`✅ CORS allowed origin: ${origin}`);
        callback(null, true);
      } else {
        logger.warn(`❌ CORS blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Allow cookies in both directions
    methods: CORS_ALLOWED_PATHS.METHODS,
    allowedHeaders: CORS_ALLOWED_PATHS.HEADERS,
    exposedHeaders: CORS_ALLOWED_PATHS.EXPOSED_HEADERS,
    maxAge: CORS_ALLOWED_PATHS.MAX_AGE,
  });
}

/**
 * Configure Session middleware
 */
export function configureSession(pool: Pool): any {
  const PostgresStore = pgSession(session);

  const isProduction = env.NODE_ENV === "production";

  const sessionConfig: SessionOptions = {
    store: new PostgresStore({
      pool,
      tableName: SESSION_CONFIG.TABLE_NAME,
      createTableIfMissing: true,
    }),
    secret: env.SESSION_SECRET,
    resave: SESSION_CONFIG.RESAVE,
    saveUninitialized: SESSION_CONFIG.SAVE_UNINITIALIZED,
    proxy: true,
    name: COOKIE_CONFIG.NAME,
    cookie: {
      maxAge: COOKIE_CONFIG.MAX_AGE,
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      path: COOKIE_CONFIG.PATH,
    },
  };

  return session(sessionConfig);
}

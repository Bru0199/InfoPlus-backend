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
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
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
    resave: false,
    saveUninitialized: false,
    proxy: true,
    name: COOKIE_CONFIG.NAME,
    cookie: {
      maxAge: COOKIE_CONFIG.MAX_AGE,
      secure: isProduction ? true : false,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      path: COOKIE_CONFIG.PATH,
    },
  };

  return session(sessionConfig);
}

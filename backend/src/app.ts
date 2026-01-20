import express from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import passport from "./auth/passport.js";
import authRouter from "./auth/routes.js";
import chatRouter from "./chat/routes.js";
import { pool, db } from "./db/index.js"; // Ensure you export 'pool' from your db file
import { env } from "./env.js";
import { isAuthenticated } from "./auth/middleware.js";
import { sql } from "drizzle-orm";

const app = express();

// Initialize database tables on app startup (needed for Vercel serverless)
async function initializeDatabaseTables(): Promise<void> {
  try {
    console.log("🔧 Initializing database tables...");

    // Migration 0001: Session table
    try {
      await db.execute(
        sql`
          CREATE TABLE IF NOT EXISTS "session" (
            "sid" varchar NOT NULL,
            "sess" jsonb NOT NULL,
            "expire" timestamp(6) NOT NULL,
            CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
          );
        `,
      );
      console.log("✅ Session table created/verified");
    } catch (tableErr) {
      console.warn("⚠️ Session table creation warning:", tableErr);
    }

    // Create index on expire column for performance
    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`,
      );
      console.log("✅ Session expire index created/verified");
    } catch (indexErr) {
      console.warn("⚠️ Session index creation warning:", indexErr);
    }

    // Migration 0002: Core tables (users, conversations, messages)
    try {
      await db.execute(
        sql`
          CREATE TABLE IF NOT EXISTS "users" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "email" text NOT NULL UNIQUE,
            "name" text,
            "image" text,
            "provider" text NOT NULL,
            "provider_id" text NOT NULL UNIQUE,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `,
      );
      console.log("✅ Users table created/verified");
    } catch (err) {
      console.warn("⚠️ Users table creation warning:", err);
    }

    try {
      await db.execute(
        sql`
          CREATE TABLE IF NOT EXISTS "conversations" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "title" text DEFAULT 'New Chat',
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL
          );
        `,
      );
      console.log("✅ Conversations table created/verified");
    } catch (err) {
      console.warn("⚠️ Conversations table creation warning:", err);
    }

    try {
      await db.execute(
        sql`
          CREATE TABLE IF NOT EXISTS "messages" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
            "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "role" text NOT NULL,
            "content" text NOT NULL,
            "tool_calls" jsonb,
            "tool_result" jsonb,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
        `,
      );
      console.log("✅ Messages table created/verified");
    } catch (err) {
      console.warn("⚠️ Messages table creation warning:", err);
    }

    // Create indexes
    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "idx_conversations_user_id" ON "conversations"("user_id");`,
      );
      console.log("✅ Conversations user_id index created/verified");
    } catch (err) {
      console.warn("⚠️ Conversations index creation warning:", err);
    }

    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages"("conversation_id");`,
      );
      console.log("✅ Messages conversation_id index created/verified");
    } catch (err) {
      console.warn("⚠️ Messages index creation warning:", err);
    }

    try {
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS "idx_messages_user_id" ON "messages"("user_id");`,
      );
      console.log("✅ Messages user_id index created/verified");
    } catch (err) {
      console.warn("⚠️ Messages user_id index creation warning:", err);
    }

    console.log("✅ Database tables initialized successfully.");
  } catch (error) {
    console.error(
      "❌ Database initialization error:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

// Initialize database tables immediately
initializeDatabaseTables().catch((err) => {
  console.error("❌ Failed to initialize database:", err);
  // Don't exit - let the app start anyway so Vercel can show logs
});

// Trust reverse proxy (Vercel/Nginx) - CRITICAL for production cookies
app.set("trust proxy", 1);

const PostgresStore = pgSession(session);

const isProduction = process.env.NODE_ENV === "production";

// Session configuration
app.use(
  session({
    store: new PostgresStore({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Don't save empty sessions
    proxy: true, // Trust X-Forwarded-* headers
    name: "connect.sid", // Session cookie name
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: true, // HTTPS only (always enabled for production Vercel)
      httpOnly: true, // Prevent XSS
      sameSite: "none", // Cross-site cookies for production OAuth
      path: "/",
    },
  }),
);

// Session debugging middleware
app.use((req, res, next) => {
  console.log("📋 Request:", {
    method: req.method,
    path: req.path,
    sessionID: req.sessionID,
    hasSession: !!req.session,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    user: req.user ? (req.user as any).email : null,
  });
  next();
});

// CORS configuration - MUST be before routes
// Explicitly allow the deployed frontend domain alongside env.FRONTEND_URL
const allowedOrigins = [
  env.FRONTEND_URL,
  "https://info-plus-frontend.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ CORS blocked origin:", origin);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
  }),
);

app.use(express.json());

// 3. Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// 4. Routes
app.get("/", (req, res) => {
  res.status(200).json({
    message: "InfoPlus Backend API is running",
    version: "1.0.1",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      chat: "/api/chat",
    },
  });
});

app.use("/api/auth", authRouter);
app.use("/api/chat", isAuthenticated, chatRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    user: req.user,
    session: {
      id: req.sessionID,
      exists: !!req.session,
      authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    },
    environment: process.env.NODE_ENV,
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const { db } = await import("./db/index.js");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    res.status(200).json({ database: "Connected ✅" });
  } catch (error: any) {
    res.status(500).json({ database: "Failed ❌", error: error.message });
  }
});

export { app };
export default app;

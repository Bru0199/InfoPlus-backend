import express from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import passport from "./auth/passport.js";
import authRouter from "./auth/routes.js";
import chatRouter from "./chat/routes.js";
import { pool } from "./db/index.js"; // Ensure you export 'pool' from your db file
import { env } from "./env.js";
import { isAuthenticated } from "./auth/middleware.js";

const app = express();

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
      secure: isProduction, // HTTPS only in production
      httpOnly: true, // Prevent XSS
      sameSite: isProduction ? "none" : "lax", // Cross-site for production
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
const allowedOrigins = [env.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"];

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

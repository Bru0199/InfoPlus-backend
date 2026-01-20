import express from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import passport from "../src/auth/passport.ts";
import authRouter from "./auth/routes.ts";
import chatRouter from "./chat/routes.ts";
import { pool } from "./db/index.ts"; // Ensure you export 'pool' from your db file
import { env } from "./env.ts";
import { isAuthenticated } from "./auth/middleware.ts";

const app = express();
const PostgresStore = pgSession(session);

app.use(
  session({
    store: new PostgresStore({
      pool: pool,
      tableName: "session", // Ensure you ran the SQL to create this table
    }),
    secret: env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  }),
);

// 2. Middleware
const allowedOrigins = [env.FRONTEND_URL, "http://localhost:3000"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

// 3. Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// 4. Routes
app.use("/api/auth", authRouter);
app.use("/api/chat", isAuthenticated, chatRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "UP", user: req.user });
});

export default app;

/**
 * Application Constants
 * Centralized configuration for error messages, API paths, and defaults
 */

// API Routes
export const API_ROUTES = {
  AUTH: {
    BASE: "/api/auth",
    GOOGLE: "/google",
    GITHUB: "/github",
    GOOGLE_CALLBACK: "/google/callback",
    GITHUB_CALLBACK: "/github/callback",
    ME: "/me",
    LOGOUT: "/logout",
  },
  CHAT: {
    BASE: "/api/chat",
    MESSAGE: "/message",
    CONVERSATIONS: "/conversations",
    CONVERSATION: "/conversation/:conversationId",
  },
  HEALTH: "/api/health",
  DB_TEST: "/api/db-test",
};

// Error Messages
export const ERROR_MESSAGES = {
  AUTH: {
    SESSION_REGEN_FAILED: "Session regeneration failed",
    NO_USER: "User not found in request",
    SESSION_SAVE_FAILED: "Failed to save session",
    CALLBACK_ERROR: "OAuth callback error",
    UNAUTHORIZED: "Unauthorized: Please log in to use the AI chat.",
  },
  CHAT: {
    MISSING_FIELDS: "Missing required fields",
    FETCH_FAILED: "Failed to fetch conversations",
    MESSAGE_FETCH_FAILED: "Failed to fetch messages",
    DELETE_FAILED: "Server error during deletion",
    NOT_FOUND: "Conversation not found or unauthorized",
  },
  DB: {
    INIT_FAILED: "Database initialization error",
    CONNECTION_FAILED: "Database connection failed",
  },
};

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    GOOGLE_SUCCESS: "✅ Google authentication successful",
    GITHUB_SUCCESS: "✅ GitHub authentication successful",
    LOGOUT: "Logged out successfully",
    DELETED: "Deleted successfully",
  },
};

// Cookie Configuration
export const COOKIE_CONFIG = {
  MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  NAME: "connect.sid",
  PATH: "/",
};

// Session Configuration
export const SESSION_CONFIG = {
  SAVE_UNINITIALIZED: false,
  RESAVE: false,
  TABLE_NAME: "session",
};

// CORS Configuration
export const CORS_ALLOWED_PATHS = {
  METHODS: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  HEADERS: ["Content-Type", "Authorization"],
  EXPOSED_HEADERS: ["set-cookie"],
  MAX_AGE: 86400, // 24 hours
};

// OAuth Scopes
export const OAUTH_SCOPES = {
  GOOGLE: ["profile", "email"],
  GITHUB: ["user:email"],
};

// Database Tables
export const DB_TABLES = {
  SESSION: "session",
  USERS: "users",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
};

// Log Levels
export const LOG_LEVELS = {
  INFO: "ℹ️",
  SUCCESS: "✅",
  WARNING: "⚠️",
  ERROR: "❌",
  PROCESS: "⚙️",
  DATABASE: "🔧",
  NETWORK: "📡",
  SECURITY: "🔒",
};

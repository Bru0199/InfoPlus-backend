import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// 1. Enums for Data Integrity
export const roleEnum = pgEnum("role", ["system", "user", "assistant", "tool","model"
]);
export const providerEnum = pgEnum("provider", ["google", "github"]);

// 2. Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  provider: providerEnum("provider").notNull(),
  providerId: text("provider_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Conversations Table
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").default("New Chat"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Messages Table
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  // Adding userId here allows for faster permission checks
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  role: roleEnum("role").notNull(),
  content: text("content").notNull(),

  /** * TOOL CALLING SUPPORT
   */
  toolCalls: jsonb("tool_calls"),
  toolResult: jsonb("tool_result"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Session Table (for express-session with Neon)
export const sessions = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey().notNull(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (table) => ({
    expireIndex: index("IDX_session_expire").on(table.expire),
  }),
);

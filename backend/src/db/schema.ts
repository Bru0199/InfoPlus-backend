import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "system",
  "user",
  "assistant",
  "tool",
  "model",
]);
export const providerEnum = pgEnum("provider", ["google", "github"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  provider: providerEnum("provider").notNull(),
  providerId: text("provider_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authProviders = pgTable(
  "auth_providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    provider: providerEnum("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    providerUserUnique: uniqueIndex("auth_providers_provider_user_unique").on(
      table.provider,
      table.providerUserId,
    ),
    userProviderUnique: uniqueIndex("auth_providers_user_provider_unique").on(
      table.userId,
      table.provider,
    ),
  }),
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").default("New Chat"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  role: roleEnum("role").notNull(),
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls"),
  toolResult: jsonb("tool_result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

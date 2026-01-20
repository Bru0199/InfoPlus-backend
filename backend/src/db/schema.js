"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = exports.conversations = exports.users = exports.providerEnum = exports.roleEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// 1. Enums for Data Integrity
exports.roleEnum = (0, pg_core_1.pgEnum)("role", ["system", "user", "assistant", "tool", "model"
]);
exports.providerEnum = (0, pg_core_1.pgEnum)("provider", ["google", "github"]);
// 2. Users Table
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    name: (0, pg_core_1.text)("name"),
    image: (0, pg_core_1.text)("image"),
    provider: (0, exports.providerEnum)("provider").notNull(),
    providerId: (0, pg_core_1.text)("provider_id").notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// 3. Conversations Table
exports.conversations = (0, pg_core_1.pgTable)("conversations", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .references(function () { return exports.users.id; }, { onDelete: "cascade" })
        .notNull(),
    title: (0, pg_core_1.text)("title").default("New Chat"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// 4. Messages Table
exports.messages = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    conversationId: (0, pg_core_1.uuid)("conversation_id")
        .references(function () { return exports.conversations.id; }, { onDelete: "cascade" })
        .notNull(),
    // Adding userId here allows for faster permission checks
    userId: (0, pg_core_1.uuid)("user_id")
        .references(function () { return exports.users.id; }, { onDelete: "cascade" })
        .notNull(),
    role: (0, exports.roleEnum)("role").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    /** * TOOL CALLING SUPPORT
     */
    toolCalls: (0, pg_core_1.jsonb)("tool_calls"),
    toolResult: (0, pg_core_1.jsonb)("tool_result"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});

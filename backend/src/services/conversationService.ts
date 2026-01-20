import { db } from "../db/index.ts";
import {
  conversations as conversationsTable,
  messages as messagesTable,
} from "../db/schema.ts";
import { eq, and, desc } from "drizzle-orm";

export const conversationService = {
  async getUserConversations(userId: string) {
    return await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.userId, userId))
      .orderBy(desc(conversationsTable.updatedAt));
  },

  async deleteById(userId: string, conversationId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(conversationsTable)
        .where(
          and(
            eq(conversationsTable.id, conversationId),
            eq(conversationsTable.userId, userId),
          ),
        );

      // result.rowCount tells us if a row was actually found and deleted
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error in ConversationService.deleteById:", error);
      throw error;
    }
  },

  async getMessagesByConversationId(userId: string, conversationId: string) {
    return await db
      .select()
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.conversationId, conversationId),
          eq(messagesTable.userId, userId),
        ),
      )
      .orderBy(messagesTable.createdAt);
  },
};

/**
 * Saves assistant/tool response messages to the database.
 * Used after a successful chat run (single model or fallback).
 */

import { db } from "../db/index.js";
import { messages as messagesTable } from "../db/schema.js";
import { logger } from "../utils/logger.js";

export type ResponseWithMessages = {
  messages: Array<{ role?: string; content?: unknown; [key: string]: unknown }>;
};

export async function saveResponseMessages(
  conversationId: string,
  userId: string,
  response: ResponseWithMessages
): Promise<void> {
  logger.info("Saving response messages");
  for (const msg of response.messages) {
    if (msg.role === "user") continue;

    let toolCallsData: string | null = null;
    let toolResultData: string | null = null;

    if (Array.isArray(msg.content)) {
      const toolCallParts = (msg.content as any[]).filter(
        (p: any) => p.type === "tool-call"
      );
      const toolResultParts = (msg.content as any[]).filter(
        (p: any) => p.type === "tool-result"
      );

      if (toolCallParts.length > 0) {
        toolCallsData = JSON.stringify(
          toolCallParts.map((tc: any) => ({
            id: tc.toolCallId || tc.id || `tool_${Date.now()}`,
            toolName: tc.toolName || "unknown",
            args: tc.args || {},
          }))
        );
      }
      if (toolResultParts.length > 0) {
        toolResultData = JSON.stringify(
          toolResultParts.map((tr: any) => ({
            id: tr.toolCallId || tr.id,
            toolName: tr.toolName || "unknown",
            result: tr.result ?? tr.output ?? {},
          }))
        );
      }
    }

    const contentStr =
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content);

    await db.insert(messagesTable).values({
      conversationId,
      userId,
      role: msg.role as "assistant" | "system",
      content: contentStr,
      toolCalls: toolCallsData,
      toolResult: toolResultData,
    });
  }
}

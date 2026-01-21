import { streamText, type StreamTextResult, type ModelMessage } from "ai";
import { geminiModel } from "../chat/ai.js";
import { allTools } from "../chat/tools.js";
import { db } from "../db/index.js";
import {
  conversations as conversationsTable,
  messages as messagesTable,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger.js";

export const ChatService = {
  async processRequest(
    userId: string,
    conversationId: string,
    messages: any[],
  ): Promise<StreamTextResult<any, any>> {
    const existingConvo = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .limit(1);

    if (existingConvo.length === 0) {
      await db.insert(conversationsTable).values({
        id: conversationId,
        userId: userId,
        title: messages[0]?.content?.substring(0, 40) || "New Chat",
      });
    } else {
      await db
        .update(conversationsTable)
        .set({ updatedAt: new Date() })
        .where(eq(conversationsTable.id, conversationId));
    }

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role === "user") {
      await db.insert(messagesTable).values({
        conversationId,
        userId,
        role: "user",

        content: lastUserMessage.content,
      });
    }

    const safeMessages = Array.isArray(messages) ? messages : [];

    if (safeMessages.length === 0) {
      throw new Error(
        "ChatService received an empty or undefined messages array.",
      );
    }

    const coreMessages: ModelMessage[] = safeMessages.map((m) => ({
      role: m.role ?? "user",
      content: m.content
        ? typeof m.content === "string"
          ? m.content
          : JSON.stringify(m.content)
        : "",
    }));

    return streamText({
      model: geminiModel,
      system: `
You are a real-time assistant. 
- If the user asks about weather in any way, detect the city or location they mention, and call the 'getWeather' tool and Put the detected city/location directly into the 'location' parameter. 
- Do not answer about weather yourself; always use the tool.

- If the user asks about stock prices, detect the ticker symbol and call 'getStockPrice'. Put that detected symbol into 'symbol' parameter

- If the user asks about F1 races, call 'getF1Matches'.

Always extract the necessary value from the user's message automatically.
- For weather, stock prices, or F1, call the appropriate tool immediately.
- DO NOT explain that you are calling a tool. 
- DO NOT provide internal reasoning or "Chain of Thought."
- Only output the final tool call or the final natural language response based on the tool's result.

`,
      messages: coreMessages,
      tools: allTools,
      onFinish: async ({ response }) => {
        logger.info("Chat stream finished, storing messages");

        for (const msg of response.messages) {
          if ((msg as any).role === "user") continue;

          let toolCallsData = null;
          let toolResultData = null;

          if (Array.isArray((msg as any).content)) {
            const toolCallParts = (msg as any).content.filter(
              (p: any) => p.type === "tool-call"
            );
            const toolResultParts = (msg as any).content.filter(
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
              logger.info("Storing tool calls:", toolCallsData);
            }

            if (toolResultParts.length > 0) {
              toolResultData = JSON.stringify(
                toolResultParts.map((tr: any) => ({
                  id: tr.toolCallId || tr.id,
                  toolName: tr.toolName || "unknown",
                  result: tr.result || tr.output || {},
                }))
              );
              logger.info("Storing tool results:", toolResultData);
            }
          }

          try {
            const contentStr =
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content);

            await db.insert(messagesTable).values({
              conversationId,
              userId,
              role: msg.role as any,
              content: contentStr,
              toolCalls: toolCallsData,
              toolResult: toolResultData,
            });

            logger.info(`Message stored: role=${msg.role}, toolCalls=${toolCallsData ? "yes" : "no"}, toolResult=${toolResultData ? "yes" : "no"}`);
          } catch (error) {
            logger.error("Error storing message:", error);
          }
        }
      },
    });
  },
};

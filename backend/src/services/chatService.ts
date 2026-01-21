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

          const toolCalls =
            (msg as any).toolCalls ||
            (Array.isArray((msg as any).content)
              ? (msg as any).content.filter((p: any) => p.type === "tool-call")
              : null);

          const toolResults =
            (msg as any).toolResults ||
            (Array.isArray(msg.content)
              ? msg.content.filter((p) => p.type === "tool-result")
              : null);

          try {
            await db.insert(messagesTable).values({
              conversationId,
              userId,
              role: msg.role as any,
              content:
                typeof msg.content === "string"
                  ? msg.content
                  : JSON.stringify(msg.content),
              toolCalls: toolCalls?.length ? JSON.stringify(toolCalls) : null,
              toolResult: toolResults?.length
                ? JSON.stringify(toolResults)
                : null,
            });
          } catch (error) {
            logger.error("Error storing message:", error);
          }
        }
      },
    });
  },
};

import type { ModelMessage } from "ai";
import { runChatWithFallback } from "../ai/chat-with-fallback.js";
import { env } from "../env.js";
import { db } from "../db/index.js";
import {
  conversations as conversationsTable,
  messages as messagesTable,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { saveResponseMessages } from "./saveResponseMessages.js";
import { getWeather } from "./weather.service.js";
import { getStockQuoteFromUserQuery } from "./stock.service.js";
import { getF1Matches } from "./f1.service.js";
import { extractLocationForWeather } from "../utils/toolInputNormalize.js";
import { isF1Intent, isStockIntent, isWeatherIntent } from "../utils/chatIntent.js";

type IncomingMessage = { role?: string; content?: unknown };

export const ChatService = {
  async processRequest(
    userId: string,
    conversationId: string,
    messages: IncomingMessage[],
  ): Promise<{ text: string; content: string }> {
    const existingConvo = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .limit(1);

    if (existingConvo.length === 0) {
      const firstContent = messages[0]?.content;
      const titleStr =
        typeof firstContent === "string"
          ? firstContent.substring(0, 40)
          : "New Chat";
      await db.insert(conversationsTable).values({
        id: conversationId,
        userId: userId,
        title: titleStr || "New Chat",
      });
    } else {
      await db
        .update(conversationsTable)
        .set({ updatedAt: new Date() })
        .where(eq(conversationsTable.id, conversationId));
    }

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === "user") {
      const raw = lastUserMessage.content;
      const contentStr =
        typeof raw === "string" ? raw : JSON.stringify(raw ?? "");
      await db.insert(messagesTable).values({
        conversationId,
        userId,
        role: "user",
        content: contentStr,
      });
    }

    const safeMessages = Array.isArray(messages) ? messages : [];
    if (safeMessages.length === 0) {
      throw new Error(
        "ChatService received an empty or undefined messages array."
      );
    }

    // Tool-first routing: if the user is clearly asking for weather/stock/F1,
    // skip the model entirely and run the tool directly.
    const lastContentRaw = safeMessages[safeMessages.length - 1]?.content;
    const lastText =
      typeof lastContentRaw === "string"
        ? lastContentRaw.trim()
        : JSON.stringify(lastContentRaw ?? "").trim();

    const looksLikeWeather = isWeatherIntent(lastText);
    const looksLikeStock = isStockIntent(lastText);
    const looksLikeF1 = isF1Intent(lastText);

    if (looksLikeWeather || looksLikeStock || looksLikeF1) {
      let toolName: "getWeather" | "getStockPrice" | "getF1Matches";
      let output: unknown;

      if (looksLikeWeather) {
        toolName = "getWeather";
        const location = extractLocationForWeather(lastText);
        output = location
          ? await getWeather(location)
          : {
              error:
                "Please name a city or place for weather (e.g. weather in Paris).",
            };
      } else if (looksLikeStock) {
        toolName = "getStockPrice";
        output = await getStockQuoteFromUserQuery(lastText);
      } else {
        toolName = "getF1Matches";
        output = await getF1Matches();
      }

      const parts = [
        { type: "text" as const, text: "" },
        { type: "tool-result" as const, toolName, output },
      ];
      const content = JSON.stringify(parts);

      await db.insert(messagesTable).values({
        conversationId,
        userId,
        role: "assistant",
        content,
        toolResult: [{ toolName, result: output }],
      });

      return { text: "", content };
    }

    const coreMessages: ModelMessage[] = safeMessages.map((m) => ({
      role: (m.role ?? "user") as "user" | "assistant" | "system",
      content: m.content
        ? typeof m.content === "string"
          ? m.content
          : JSON.stringify(m.content)
        : "",
    }));

    const { text, content } = await runChatWithFallback({
      apiKey: env.OPENROUTER_API_KEY,
      messages: coreMessages,
      conversationId,
      userId,
      onSaveResponse: (response) =>
        saveResponseMessages(conversationId, userId, response),
    });

    return { text, content };
  },
};

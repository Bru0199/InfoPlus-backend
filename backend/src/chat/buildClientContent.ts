/**
 * Builds the content string to send to the frontend so it can render
 * both text and tool-result cards (WeatherCard, StockCard, F1Card).
 */

import { logger } from "../utils/logger.js";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "tool-result"; toolName: string; output: unknown };

/**
 * From AI SDK response.messages, build a content array the frontend expects:
 * [{ type: "text", text }, { type: "tool-result", toolName, output }, ...]
 */
export function buildContentFromResponse(response: {
  messages: Array<{ role?: string; content?: unknown }>;
}): string {
  const parts: ContentPart[] = [];
  for (const msg of response.messages) {
    if (msg.role !== "assistant") continue;
    const content = msg.content;
    if (Array.isArray(content)) {
      for (const p of content as Array<Record<string, unknown>>) {
        if (p.type === "text" && typeof p.text === "string") {
          parts.push({ type: "text", text: p.text });
        }
        if (p.type === "tool-result") {
          const toolName = (p.toolName as string) || "unknown";
          const output = p.output ?? p.result;
          parts.push({ type: "tool-result", toolName, output: output ?? null });
        }
      }
    }
  }
  const toolNames = parts
    .filter((p) => p.type === "tool-result")
    .map((p: any) => p.toolName);
  logger.info("buildContentFromResponse parts count:", {
    total: parts.length,
    toolResults: toolNames,
  });
  if (parts.length === 0) return "";
  return JSON.stringify(parts);
}

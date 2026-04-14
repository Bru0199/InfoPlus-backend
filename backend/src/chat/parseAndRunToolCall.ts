/**
 * When the model returns literal <tool_call> XML-like text instead of using
 * the SDK's tool format, we parse it and run the tool so the frontend can show cards.
 */

import { getWeather } from "../services/weather.service.js";
import { getStockPrice } from "../services/stock.service.js";
import { getF1Matches } from "../services/f1.service.js";
import { logger } from "../utils/logger.js";

// Match <tool_call>...<function=name>...<parameter=key>value</parameter>...</tool_call>
const PARAM_BLOCK_REG = /<parameter=(\w+)>\s*([\s\S]*?)<\/parameter>/gi;
const FUNCTION_REG = /<function=(\w+)>/i;

export interface ParsedToolCall {
  toolName: string;
  args: Record<string, string>;
}

export function parseToolCallFromText(text: string): ParsedToolCall | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed.includes("tool_call") || !trimmed.includes("function="))
    return null;

  const funcMatch = FUNCTION_REG.exec(trimmed);
  if (!funcMatch) return null;
  const toolName = funcMatch[1] ?? "";
  if (!toolName) return null;
  const args: Record<string, string> = {};
  let m: RegExpExecArray | null;
  PARAM_BLOCK_REG.lastIndex = 0;
  while ((m = PARAM_BLOCK_REG.exec(trimmed)) !== null) {
    const key = m[1];
    const value = (m[2] || "").trim();
    if (key && value) args[key] = value;
  }
  logger.info("Parsed literal tool_call:", { toolName, args });
  return { toolName, args };
}

/**
 * Execute a single tool by name and args. Returns the tool result (object or { error }).
 */
export async function executeParsedTool(
  parsed: ParsedToolCall
): Promise<{ toolName: string; output: unknown }> {
  const { toolName, args } = parsed;
  try {
    if (toolName === "getWeather") {
      const location = args.location || args.city || "";
      const out = await getWeather(location);
      return { toolName: "getWeather", output: out };
    }
    if (toolName === "getStockPrice") {
      const symbol = args.symbol || args.code || "";
      const out = await getStockPrice(symbol);
      return { toolName: "getStockPrice", output: out };
    }
    if (toolName === "getF1Matches") {
      const out = await getF1Matches();
      return { toolName: "getF1Matches", output: out };
    }
  } catch (e) {
    logger.warn("executeParsedTool error", e);
    return { toolName, output: { error: String(e) } };
  }
  return { toolName, output: { error: "Unknown tool" } };
}

/**
 * If text looks like a literal tool call, parse it, run the tool, and return
 * a content array string for the client; otherwise return null.
 */
export async function tryParseAndRunToolCall(
  text: string
): Promise<string | null> {
  const parsed = parseToolCallFromText(text);
  if (!parsed) return null;
  const result = await executeParsedTool(parsed);
  const parts = [
    { type: "text" as const, text: "" },
    { type: "tool-result" as const, toolName: result.toolName, output: result.output },
  ];
  return JSON.stringify(parts);
}

/**
 * Runs chat (streamText) with model fallback: tries each free model in order
 * until one returns non-empty text. Uses API-fetched free model list.
 * Returns structured content (text + tool-result parts) so the frontend can render cards.
 */

import { streamText, NoOutputGeneratedError, type ModelMessage } from "ai";
import { createOpenRouterClient, getModel } from "./openrouter.client.js";
import { getOrderedModelIds } from "./resolve-model.js";
import { allTools } from "../chat/tools.js";
import { buildContentFromResponse } from "../chat/buildClientContent.js";
import { tryParseAndRunToolCall } from "../chat/parseAndRunToolCall.js";
import { logger } from "../utils/logger.js";
import { ChatAllModelsFailedError } from "../chat/chatErrors.js";

const SYSTEM_PROMPT = `
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
`;

export interface RunChatWithFallbackOptions {
  apiKey: string;
  messages: ModelMessage[];
  conversationId: string;
  userId: string;
  onSaveResponse: (response: { messages: Array<{ role?: string; content?: unknown; [key: string]: unknown }> }) => Promise<void>;
}

// Sticky model selection: once a free model works for a user, keep using it.
// Falls back only if the chosen model errors out.
const preferredModelByUser = new Map<string, { modelId: string; chosenAt: number }>();
const MODEL_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

/** Avoid long requests when many free models are flaky. */
const MAX_MODELS_PER_REQUEST = 14;

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

type StreamSuccess = {
  text: string;
  content: string;
  modelId: string;
  response: { messages: Array<{ role?: string; content?: unknown }> };
};

async function tryStreamWithModel(
  client: ReturnType<typeof createOpenRouterClient>,
  modelId: string,
  messages: ModelMessage[],
  onSaveResponse: RunChatWithFallbackOptions["onSaveResponse"],
): Promise<{ ok: true; data: StreamSuccess } | { ok: false; error: unknown }> {
  const model = getModel(client, modelId);
  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages,
    tools: allTools,
  });

  try {
    const [fullText, response] = await Promise.all([
      result.text,
      result.response,
    ]);

    const text = typeof fullText === "string" ? fullText : "";
    if (!text.trim()) {
      logger.warn(`Model returned empty text: ${modelId}, trying next`);
      return { ok: false, error: new Error("empty text") };
    }

    await onSaveResponse(response);

    let content = buildContentFromResponse(
      response as { messages: Array<{ role?: string; content?: unknown }> },
    );
    if (!content && /<tool_call>|<function=/.test(text)) {
      const fallbackContent = await tryParseAndRunToolCall(text);
      if (fallbackContent) {
        content = fallbackContent;
        logger.info("Parsed literal tool call and ran tool for client content");
      }
    }

    return {
      ok: true,
      data: {
        text,
        content: content || text,
        modelId,
        response: response as StreamSuccess["response"],
      },
    };
  } catch (err) {
    if (NoOutputGeneratedError.isInstance(err)) {
      logger.warn(
        `No output from stream for model ${modelId} (OpenRouter returned no steps — trying next model)`,
      );
    } else {
      logger.warn(`Model failed: ${modelId}`, err);
    }
    return { ok: false, error: err };
  }
}

/**
 * Tries each free model in order until one returns non-empty text.
 * Saves the winning response via onSaveResponse.
 * Returns text and content: content is a JSON string of parts (text + tool-result) for the frontend to render cards.
 */
export async function runChatWithFallback(
  options: RunChatWithFallbackOptions,
): Promise<{ text: string; content: string; modelId: string }> {
  const { apiKey, messages, onSaveResponse, userId } = options;
  const client = createOpenRouterClient(apiKey);
  const cached = preferredModelByUser.get(userId);
  const cachedModelId =
    cached && Date.now() - cached.chosenAt < MODEL_CACHE_TTL_MS
      ? cached.modelId
      : null;

  const fullList = uniqueIds(await getOrderedModelIds(apiKey));
  if (fullList.length === 0) {
    throw new Error("No free models available from OpenRouter");
  }

  // Sticky: try only the cached model first; on failure, skip it in the full list (do not retry it first again).
  const firstPassIds = cachedModelId
    ? [cachedModelId]
    : fullList.slice(0, MAX_MODELS_PER_REQUEST);

  let lastError: unknown;

  const runList = async (ids: string[]): Promise<StreamSuccess | null> => {
    const slice = uniqueIds(ids).slice(0, MAX_MODELS_PER_REQUEST);
    for (const modelId of slice) {
      logger.info(`Trying model: ${modelId}`);
      const out = await tryStreamWithModel(client, modelId, messages, onSaveResponse);
      if (out.ok) {
        logger.info(`Model succeeded: ${modelId}`);
        logger.info("Raw model text (truncated):", out.data.text.slice(0, 200));
        preferredModelByUser.set(userId, { modelId, chosenAt: Date.now() });
        return out.data;
      }
      lastError = out.error;
    }
    return null;
  };

  let success = await runList(firstPassIds);

  if (!success && cachedModelId) {
    preferredModelByUser.delete(userId);
    // Important: do not put the failed sticky model first again — try other free models.
    const rest = fullList.filter((id) => id !== cachedModelId);
    const secondPass = rest.length > 0 ? rest : fullList;
    logger.info(
      `Sticky model ${cachedModelId} failed; falling back to ${secondPass.length} other model(s)`,
    );
    success = await runList(secondPass);
  }

  if (!success) {
    const msg =
      lastError instanceof Error
        ? lastError.message
        : "All models failed or returned empty";
    throw new ChatAllModelsFailedError(
      `No usable reply from any model. ${msg} Set OPENROUTER_MODEL to a stable free model (e.g. google/gemini-2.0-flash-exp:free).`,
      { cause: lastError },
    );
  }

  const { text, content, modelId } = success;
  return { text, content, modelId };
}

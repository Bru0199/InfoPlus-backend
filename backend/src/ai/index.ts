/**
 * AI module — composes OpenRouter client and model for chat.
 * Depends on: config (model registry), env, openrouter client.
 */

import type { LanguageModel } from "ai";
import { createOpenRouterClient, getModel } from "./openrouter.client.js";
import { getResolvedModelId } from "./resolve-model.js";
import { env } from "../env.js";

let cachedModel: LanguageModel | null = null;

function createChatModel(): LanguageModel {
  const client = createOpenRouterClient(env.OPENROUTER_API_KEY);
  const modelId = getResolvedModelId();
  return getModel(client, modelId);
}

/** Returns the language model used for chat (cached). */
export function getChatModel(): LanguageModel {
  if (!cachedModel) cachedModel = createChatModel();
  return cachedModel;
}

/**
 * OpenRouter API client — creates client and resolves a model by ID.
 * Single responsibility: OpenRouter client + model binding.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

export function createOpenRouterClient(apiKey: string) {
  return createOpenRouter({ apiKey });
}

export function getModel(client: ReturnType<typeof createOpenRouter>, modelId: string): LanguageModel {
  return client(modelId);
}

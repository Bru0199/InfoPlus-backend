/**
 * Resolves which OpenRouter model ID(s) to use, in order (for fallback).
 * Single responsibility: env + API-backed free list → ordered model ids.
 */

import { env } from "../env.js";
import { getDefaultModelId, getModelIds } from "../config/openrouter.models.js";
import { fetchFreeModelIds } from "./openrouter-models.service.js";
import { logger } from "../utils/logger.js";

export function resolveChatModelId(): string {
  const fromEnv = env.OPENROUTER_MODEL?.trim();
  if (fromEnv) return fromEnv;
  return getDefaultModelId();
}

/** Single model ID (sync, for backward compat). */
export function getResolvedModelId(): string {
  return resolveChatModelId();
}

/**
 * Ordered list of model IDs: preferred first (from env), then rest of free models from API.
 * Used for fallback when one model fails or returns empty.
 */
export async function getOrderedModelIds(apiKey: string): Promise<string[]> {
  const preferred = env.OPENROUTER_MODEL?.trim();
  let freeIds: string[];

  try {
    freeIds = await fetchFreeModelIds(apiKey);
  } catch (err) {
    logger.warn("Could not fetch free models from OpenRouter, using static list", err);
    freeIds = getModelIds();
    if (freeIds.length === 0) {
      freeIds = [getDefaultModelId()];
    }
  }

  if (preferred) {
    const rest = freeIds.filter((id) => id !== preferred);
    return [preferred, ...rest];
  }
  return freeIds;
}

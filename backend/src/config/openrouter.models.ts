/**
 * OpenRouter model registry (free models).
 * Add or remove model IDs here when OpenRouter updates their free tier.
 * No env or API keys — data only.
 */

export interface OpenRouterModelInfo {
  id: string;
  label: string;
  supportsTools?: boolean;
}

/** Known free models on OpenRouter — update this list when new free models appear */
export const OPENROUTER_FREE_MODELS: OpenRouterModelInfo[] = [
  { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash", supportsTools: true },
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B", supportsTools: false },
  { id: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B", supportsTools: false },
  { id: "openrouter/free", label: "OpenRouter Free (auto)", supportsTools: true },
];

const ID_SET = new Set(OPENROUTER_FREE_MODELS.map((m) => m.id));

export function isKnownModelId(id: string): boolean {
  return ID_SET.has(id);
}

export function getDefaultModelId(): string {
  const preferred = OPENROUTER_FREE_MODELS.find((m) => m.supportsTools);
  return preferred?.id ?? OPENROUTER_FREE_MODELS[0]?.id ?? "google/gemini-2.0-flash-exp:free";
}

export function getModelIds(): string[] {
  return OPENROUTER_FREE_MODELS.map((m) => m.id);
}

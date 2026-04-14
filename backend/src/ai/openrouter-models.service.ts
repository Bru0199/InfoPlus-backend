/**
 * Fetches free model IDs from OpenRouter API using the provided API key.
 * Single responsibility: API call + filter free models + cache.
 * No env — receives apiKey as argument.
 */

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Same idea as the website catalog filter (e.g. /models?max_price=0). The API accepts it (HTTP 200). */
function modelsListUrl(options: { maxPriceZero: boolean }): string {
  const u = new URL(OPENROUTER_MODELS_URL);
  if (options.maxPriceZero) {
    u.searchParams.set("max_price", "0");
  }
  return u.toString();
}

let cachedIds: string[] | null = null;
let cacheExpiry = 0;

function parsePrice(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function isFreeModel(model: { id: string; pricing?: Record<string, unknown> }): boolean {
  const id = model.id ?? "";
  if (id === "openrouter/free") return true;
  if (id.endsWith(":free")) return true;
  const p = model.pricing as Record<string, unknown> | undefined;
  if (p) {
    const promptCost = parsePrice(p.prompt);
    const completionCost = parsePrice(p.completion);
    if (promptCost === 0 && completionCost === 0) return true;
  }
  return false;
}

/**
 * Fetches models from OpenRouter and returns **free** model IDs only (no tools / modality ordering).
 * Order matches the API response. Uses in-memory cache with TTL.
 */
export async function fetchFreeModelIds(apiKey: string): Promise<string[]> {
  if (cachedIds !== null && Date.now() < cacheExpiry) {
    return cachedIds;
  }

  let res = await fetch(modelsListUrl({ maxPriceZero: true }), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  // If max_price is ever rejected, fall back to unfiltered list (still filter free client-side).
  if (!res.ok) {
    res = await fetch(modelsListUrl({ maxPriceZero: false }), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }

  if (!res.ok) {
    throw new Error(`OpenRouter models API error: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { data?: Array<{ id: string; pricing?: Record<string, unknown> }> };
  const data = json.data ?? [];
  const free = data.filter(isFreeModel);
  const ordered = free.map((m) => m.id);
  const unique = [...new Set(ordered)];

  cachedIds = unique;
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return cachedIds;
}

export function clearModelCache(): void {
  cachedIds = null;
  cacheExpiry = 0;
}

/**
 * EODHD symbol search: separate from real-time quotes (quota-friendly).
 * @see https://eodhd.com/financial-apis/search-api-for-stocks-etfs-mutual-funds
 */

import axios from "axios";
import { env } from "../env.js";
import { logger } from "../utils/logger.js";

export type EodSearchItem = {
  Code: string;
  Exchange: string;
  Name: string;
  Type?: string;
  Country?: string;
  isPrimary?: boolean;
};

export type StockSearchCandidate = {
  code: string;
  exchange: string;
  name: string;
};

const EODHD_SEARCH_URL = "https://eodhd.com/api/search";
const HTTP_TIMEOUT_MS = 15_000;
const SEARCH_LIMIT = 15;

const SEARCH_CACHE_TTL_MS = 86_400_000; // 24h
const SEARCH_CACHE_MAX = 500;

const searchCache = new Map<
  string,
  { code: string; exchange: string; at: number }
>();

export function normalizeSearchCacheKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function trimSearchCache(): void {
  if (searchCache.size <= SEARCH_CACHE_MAX) return;
  const entries = [...searchCache.entries()].sort((a, b) => a[1].at - b[1].at);
  const removeCount = entries.length - SEARCH_CACHE_MAX + 100;
  for (let i = 0; i < removeCount; i++) {
    const e = entries[i];
    if (e) searchCache.delete(e[0]);
  }
}

export function getCachedSymbol(key: string): { code: string; exchange: string } | null {
  const cached = searchCache.get(key);
  if (!cached || Date.now() - cached.at >= SEARCH_CACHE_TTL_MS) return null;
  return { code: cached.code, exchange: cached.exchange };
}

export function setCachedSymbol(
  key: string,
  code: string,
  exchange: string,
): void {
  searchCache.set(key, { code, exchange, at: Date.now() });
  trimSearchCache();
}

export async function fetchEodhdSearchResults(query: string): Promise<EodSearchItem[]> {
  const token = env.EODHD_API_TOKEN;
  const q = query.trim();
  if (!q) return [];

  const url = `${EODHD_SEARCH_URL}/${encodeURIComponent(q)}?api_token=${encodeURIComponent(token)}&fmt=json&limit=${SEARCH_LIMIT}&type=stock&exchange=US`;

  const { data } = await axios.get<EodSearchItem[] | { data?: EodSearchItem[] }>(url, {
    timeout: HTTP_TIMEOUT_MS,
  });

  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { data?: EodSearchItem[] }).data)) {
    return (data as { data: EodSearchItem[] }).data;
  }
  return [];
}

function scoreSearchItem(item: EodSearchItem, queryLower: string): number {
  let s = 0;
  const nameLower = (item.Name || "").toLowerCase();
  const words = queryLower.split(/\s+/).filter((w) => w.length > 1);
  if (nameLower.includes(queryLower)) s += 10;
  else if (words.length && words.every((w) => nameLower.includes(w))) s += 8;
  if (item.isPrimary === true) s += 4;
  if (item.Exchange === "US") s += 3;
  if ((item.Type || "").toLowerCase().includes("common stock")) s += 2;
  if ((item.Country || "").toUpperCase() === "USA") s += 1;
  return s;
}

const AMBIGUOUS_SCORE_THRESHOLD = 4;

export type PickSearchResult =
  | { ok: true; item: EodSearchItem }
  | {
      ok: false;
      reason: string;
      candidates?: EodSearchItem[];
    };

export function pickBestSearchResult(items: EodSearchItem[], query: string): PickSearchResult {
  if (items.length === 0) {
    return { ok: false, reason: "No symbols found for that search." };
  }

  const queryLower = query.toLowerCase().trim();
  const scored = items
    .map((item) => ({ item, score: scoreSearchItem(item, queryLower) }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top) {
    return { ok: false, reason: "No symbols found for that search." };
  }
  const second = scored[1];

  if (
    second &&
    top.score === second.score &&
    top.item.Code !== second.item.Code &&
    top.score <= AMBIGUOUS_SCORE_THRESHOLD
  ) {
    return {
      ok: false,
      reason:
        "Multiple matches — please use a ticker symbol (e.g. GS for Goldman Sachs).",
      candidates: scored.slice(0, 5).map((s) => s.item),
    };
  }

  return { ok: true, item: top.item };
}

export function toPublicCandidates(items: EodSearchItem[]): StockSearchCandidate[] {
  return items.map((c) => ({
    code: c.Code,
    exchange: c.Exchange,
    name: c.Name,
  }));
}

export function logResolvedQuote(item: EodSearchItem): void {
  logger.info("Stock quote resolved", {
    code: item.Code,
    exchange: item.Exchange,
    name: item.Name,
  });
}

import axios from "axios";
import { env } from "../env.js";
import { logger } from "../utils/logger.js";
import {
  extractStockSearchQuery,
  getKnownCompanyAliasTicker,
  resolveStockSymbol,
} from "../utils/toolInputNormalize.js";
import {
  fetchEodhdSearchResults,
  getCachedSymbol,
  logResolvedQuote,
  normalizeSearchCacheKey,
  pickBestSearchResult,
  setCachedSymbol,
  toPublicCandidates,
  type EodSearchItem,
} from "./stockLookup.js";

const REAL_TIME_TIMEOUT_MS = 15_000;

/** Backward compat: LLM tools pass an explicit symbol (US listing). */
export async function getStockPrice(symbol: string): Promise<Record<string, unknown>> {
  const s = symbol.trim().toUpperCase();
  if (!s) return { error: "No ticker symbol provided." };
  return getStockPriceByCode(s, "US");
}

/** Live quote: one API call. Prefer `CODE.EXCHANGE` (e.g. `GS.US`). */
export async function getStockPriceByCode(
  code: string,
  exchange: string,
): Promise<Record<string, unknown>> {
  const stockKey = env.EODHD_API_TOKEN;
  const pair = `${code}.${exchange}`.toUpperCase();
  const url = `https://eodhd.com/api/real-time/${encodeURIComponent(pair)}?api_token=${encodeURIComponent(stockKey)}&fmt=json`;

  try {
    logger.info("Stock real-time URL:", url.replace(stockKey, "***"));
    const { data } = await axios.get(url, { timeout: REAL_TIME_TIMEOUT_MS });
    logger.info("Stock API raw response (truncated):", JSON.stringify(data).slice(0, 300));

    if (!data || (data as { code?: string }).code === "404") {
      return { error: `Ticker ${pair} not found.` };
    }
    return data as Record<string, unknown>;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("Stock Service API Error:", msg);
    return { error: "Failed to fetch stock data." };
  }
}

/**
 * $TICKER / known alias / bare ticker → quote only.
 * Otherwise: search → pick → quote; cache successful resolutions.
 */
export async function getStockQuoteFromUserQuery(userText: string): Promise<Record<string, unknown>> {
  const dollar = userText.match(/\$([A-Za-z]{1,6})\b/);
  if (dollar?.[1]) {
    return getStockPriceByCode(dollar[1].toUpperCase(), "US");
  }

  const aliasTicker = getKnownCompanyAliasTicker(userText);
  if (aliasTicker) {
    return getStockPriceByCode(aliasTicker, "US");
  }

  const resolved = resolveStockSymbol(userText);
  if (resolved && tokenLooksLikeTickerOnly(userText, resolved)) {
    return getStockPriceByCode(resolved, "US");
  }

  const searchQuery = extractStockSearchQuery(userText);
  if (!searchQuery.trim()) {
    return {
      error:
        "Could not extract a company name or ticker. Example: “Goldman Sachs stock” or “GS”.",
    };
  }

  const cacheKey = normalizeSearchCacheKey(searchQuery);
  const cached = getCachedSymbol(cacheKey);
  if (cached) {
    logger.info(`Stock search cache hit: ${cacheKey} → ${cached.code}.${cached.exchange}`);
    return getStockPriceByCode(cached.code, cached.exchange);
  }

  let items: EodSearchItem[];
  try {
    items = await fetchEodhdSearchResults(searchQuery);
  } catch (e: unknown) {
    logger.error("EODHD search failed:", e);
    return { error: "Symbol lookup failed. Try again or use a ticker (e.g. GS)." };
  }

  const picked = pickBestSearchResult(items, searchQuery);
  if (!picked.ok) {
    const err: Record<string, unknown> = { error: picked.reason };
    if (picked.candidates?.length) {
      err.candidates = toPublicCandidates(picked.candidates);
    }
    return err;
  }

  const { Code, Exchange } = picked.item;
  setCachedSymbol(cacheKey, Code, Exchange);

  const quote = await getStockPriceByCode(Code, Exchange);
  logResolvedQuote(picked.item);
  return quote;
}

function tokenLooksLikeTickerOnly(userText: string, symbol: string): boolean {
  const cleaned = userText
    .toUpperCase()
    .replace(/\$[A-Z]{1,6}\b/, symbol)
    .replace(/[^\w\s]/g, " ")
    .trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens.length <= 2 && tokens.includes(symbol.toUpperCase());
}

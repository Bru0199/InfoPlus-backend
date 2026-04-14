/**
 * Deterministic cleanup for tool-first routes (weather / stock).
 * No extra LLM call — aliases + casing + light parsing beat brittle regex-only extraction.
 */

/** Common company / product names → US ticker (expand as needed). */
const COMPANY_TO_TICKER: Record<string, string> = {
  amazon: "AMZN",
  amzn: "AMZN",
  google: "GOOGL",
  googl: "GOOGL",
  goog: "GOOGL",
  alphabet: "GOOGL",
  apple: "AAPL",
  aapl: "AAPL",
  microsoft: "MSFT",
  msft: "MSFT",
  meta: "META",
  facebook: "META",
  fb: "META",
  tesla: "TSLA",
  tsla: "TSLA",
  nvidia: "NVDA",
  nvda: "NVDA",
  netflix: "NFLX",
  nflx: "NFLX",
  amd: "AMD",
  intel: "INTC",
  intc: "INTC",
  disney: "DIS",
  dis: "DIS",
  cocacola: "KO",
  coke: "KO",
  walmart: "WMT",
  wmt: "WMT",
  jpmorgan: "JPM",
  jpm: "JPM",
  bankofamerica: "BAC",
  bac: "BAC",
};

const SMALL_WORDS = new Set([
  "of",
  "the",
  "and",
  "in",
  "on",
  "at",
  "for",
  "de",
  "la",
  "del",
  "von",
  "da",
  "di",
  "van",
  "der",
]);

/**
 * Human-readable place names for APIs (OpenWeather accepts "New York", "São Paulo" if passed through).
 * Not programming camelCase — Title Case for each word.
 */
export function toTitleCaseLocation(input: string): string {
  const s = input.replace(/\s+/g, " ").trim();
  if (!s) return "";
  return s
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      if (word.includes("-")) {
        return word
          .split("-")
          .map((p, j) => {
            const pl = p.toLowerCase();
            if (j > 0 && SMALL_WORDS.has(pl)) return pl;
            return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
          })
          .join("-");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Strip weather boilerplate and take city after in/at/for, or the remainder. */
export function extractLocationForWeather(userText: string): string {
  let t = userText.replace(/\s+/g, " ").trim();
  t = t.replace(/^(what'?s?\s+the\s+)?(weather|forecast|temperature)\b[^?.!]*[?.!]?\s*/i, "");
  t = t.replace(/\b(weather|forecast|temperature)\s+(in|at|for)\s+/i, " ");
  const m = t.match(/\b(?:in|at|for)\s+([^?.!\n]+?)(?:[?.!]|$)/i);
  if (m?.[1]) {
    return toTitleCaseLocation(m[1].trim());
  }
  t = t.replace(/\b(weather|forecast|temperature)\b/gi, "").trim();
  t = t.replace(/^[?.!\s]+|[?.!\s]+$/g, "").trim();
  return toTitleCaseLocation(t);
}

/** Strip “stock price” noise so EODHD Search gets “Goldman Sachs”, not the whole sentence. */
export function extractStockSearchQuery(userText: string): string {
  let t = userText.replace(/\s+/g, " ").trim();
  t = t.replace(/\b(stock|stocks|share|shares|price|prices|ticker|quote|quotes|trading|market|nasdaq|nyse)\b/gi, " ");
  t = t.replace(/\b(what'?s?|how much|what is|current|the|a|an|of|for|get|show|give|me|tell)\b/gi, " ");
  t = t.replace(/\$[A-Za-z]{1,6}\b/g, "").trim();
  return t.replace(/\s+/g, " ").trim();
}

function tokenizeForStock(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[$]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Resolve a ticker: $AMZN, known company names, or ALLCAPS token.
 */
/** If any token matches a curated company→ticker map, return that ticker (fast path, no search). */
export function getKnownCompanyAliasTicker(userText: string): string {
  for (const w of tokenizeForStock(userText)) {
    if (COMPANY_TO_TICKER[w]) return COMPANY_TO_TICKER[w];
  }
  return "";
}

export function resolveStockSymbol(userText: string): string {
  const raw = userText.trim();
  const dollar = raw.match(/\$([A-Za-z]{1,6})\b/);
  if (dollar?.[1]) return dollar[1].toUpperCase();

  for (const w of tokenizeForStock(raw)) {
    if (COMPANY_TO_TICKER[w]) return COMPANY_TO_TICKER[w];
  }

  const upperTokens = raw.match(/\b[A-Z]{1,6}\b/g);
  if (upperTokens?.length) {
    const sym = upperTokens[upperTokens.length - 1];
    if (sym && sym.length >= 1 && sym.length <= 5) return sym;
  }

  return "";
}

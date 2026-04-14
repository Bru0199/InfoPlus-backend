/**
 * Heuristic routing for tool-first chat (weather / stock / F1) before calling the LLM.
 */

const COMPANY_NAME_HINT =
  /\b(amazon|google|alphabet|apple|microsoft|tesla|meta|facebook|nvidia|netflix|amd|intel|disney|walmart|goldman|sachs|morgan|jpmorgan|berkshire|blackrock|citigroup)\b/i;

const STOCK_FINANCIAL_CONTEXT =
  /\b(price|stock|share|shares|quote|ticker|trading|how much|worth|market)\b/i;

export function isWeatherIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("weather") ||
    lower.includes("forecast") ||
    lower.includes("temperature")
  );
}

export function isStockIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("stock") ||
    lower.includes("share price") ||
    /\bprice of\s+/i.test(text) ||
    /\b[a-z]{1,6}\s+stock\b/i.test(text) ||
    /\$[A-Za-z]{1,6}\b/.test(text) ||
    (COMPANY_NAME_HINT.test(text) && STOCK_FINANCIAL_CONTEXT.test(text))
  );
}

export function isF1Intent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("f1") ||
    lower.includes("formula 1") ||
    lower.includes("formula one") ||
    (lower.includes("next") && lower.includes("race"))
  );
}

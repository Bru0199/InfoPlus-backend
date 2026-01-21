import axios from "axios";
import { env } from "../env.js";
import { logger } from "../utils/logger.js";

export async function getStockPrice(symbol: string): Promise<any> {
  const stockKey = env.EODHD_API_TOKEN;

  const url = `https://eodhd.com/api/real-time/${symbol}?api_token=${stockKey}&fmt=json`;

  try {
    const { data } = await axios.get(url);

    if (!data || data.code === "404") {
      return { error: `Ticker ${symbol} not found.` };
    }
    return data;
  } catch (error: any) {
    logger.error("Stock Service API Error:", error.message);
    return { error: "Failed to fetch stock data." };
  }
}

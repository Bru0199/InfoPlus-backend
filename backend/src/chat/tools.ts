import { tool } from "ai";
import { z } from "zod";
import { getWeather } from "../services/weather.service.js";
import { getStockPrice } from "../services/stock.service.js";
import { getF1Matches } from "../services/f1.service.js";

export const allTools = {
  // 1. Weather Tool
  getWeather: tool({
    description: "Get the current weather for a specific city.",
    parameters: z.object({
      location: z
        .string()
        .describe("The name of the city, e.g., Bengaluru, London, or New York"),
    }),
    execute: async (params: any) => {
      const { location } = params as { location: string };
      console.log("passing the value location", { location });

      if (!location || location.trim() === "") {
        return "⚠️ I need a valid city name to provide weather info. Please specify one.";
      }

      console.log("Calling getWeather API with location:", location);

      return await getWeather(location);
    },
  } as any),

  // 2. Stock Tool
  getStockPrice: tool({
    description: "Get the real-time stock price for a ticker symbol.",
    parameters: z.object({
      symbol: z.string().describe("The stock ticker symbol, e.g. AAPL, TSLA"),
    }),
    execute: async (params: any) => {
      const { symbol } = params as { symbol: string };
      console.log("passing the value symbol", { symbol });

      if (!symbol || symbol.trim() === "") {
        return "⚠️ I need a valid symbol to provide stock info. Please specify one.";
      }

      console.log("Calling getStockPrice API with symbol:", symbol);

      return await getStockPrice(symbol);
    },
  } as any),

  // 3. F1 Tool
  getF1Matches: tool({
    description: "Get information about the next upcoming Formula 1 race.",
    parameters: z.object({}), // No parameters needed for "next race"
    execute: async () => {
      const result = await getF1Matches();

      console.log("---------------------------");
      console.log("Called tool.js: nextrace");
      console.log("---------------------------");

      return result;
    },
  } as any),
};

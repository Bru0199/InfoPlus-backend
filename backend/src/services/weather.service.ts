import axios from "axios";
import { env } from "../env.js";
import { logger } from "../utils/logger.js";

/** Success: OpenWeather shape. Error: { error: string } so frontend can show a card. */
export async function getWeather(location: string): Promise<Record<string, unknown> & { error?: string }> {
  const weatherKey = env.OPENWEATHER_API_KEY;

  logger.info(`Requesting weather for: "${location}"`);

  if (!location || location.trim() === "") {
    return { error: "No city name provided. Please specify a location." };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location.trim())}&units=metric&appid=${weatherKey}`;

  try {
    logger.info("Weather API URL:", url);
    const { data } = await axios.get(url);
    logger.info("Weather API raw response (truncated):", JSON.stringify(data).slice(0, 300));
    if (!data || typeof data !== "object") {
      return { error: `No weather data returned for ${location}. Please try again.` };
    }
    if (!data.main || !data.weather || !Array.isArray(data.weather) || data.weather.length === 0) {
      return { error: `Incomplete weather data for ${location}. Please try again.` };
    }
    return data as Record<string, unknown>;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { error: `I couldn't find a city named "${location}". Check the spelling and try again.` };
    }
    logger.error("Weather API Error:", error.message);
    return { error: `Unable to get weather for ${location}. Please try again later.` };
  }
}

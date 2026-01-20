// src/services/weatherService.ts
import axios from "axios";
import { env } from "../env.ts";

export async function getWeather(location: string): Promise<any> {
  const weatherKey = env.OPENWEATHER_API_KEY;

  console.log(`📡 Requesting weather for: "${location}"`);

  if (!location || location.trim() === "") {
    return { error: "No city name provided. Please specify a location." };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${weatherKey}`;

  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return `I'm sorry, I couldn't find a city named "${location}". Please check the spelling and try again.`;
    }

    console.error("Weather API Error:", error.message);
    return `I encountered an error while trying to get the weather for ${location}. Please try again later.`;
  }
}

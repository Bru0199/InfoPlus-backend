import axios from "axios";
import { logger } from "../utils/logger.js";

export async function getF1Matches(): Promise<any> {
  const url = `https://api.jolpi.ca/ergast/f1/current/next.json`;

  try {
    logger.info("F1 API URL:", url);
    const { data } = await axios.get(url);
    logger.info("F1 API raw response (truncated):", JSON.stringify(data).slice(0, 300));
    const races = data?.MRData?.RaceTable?.Races;
    const nextRace = Array.isArray(races) ? races[0] : null;

    if (!nextRace) {
      return { error: "No upcoming races found." };
    }
    return nextRace;
  } catch (error: any) {
    logger.error("F1 Service Error:", error.message);
    return { error: "Failed to fetch F1 schedule." };
  }
}

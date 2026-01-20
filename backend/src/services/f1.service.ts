// src/services/f1Service.ts
import axios from "axios";

export async function getF1Matches(): Promise<any> {
  const url = `https://api.jolpi.ca/ergast/f1/current/next.json`;

  try {
    const { data } = await axios.get(url);
    const nextRace = data.MRData.RaceTable.Races[0];

    if (!nextRace) {
      return { error: "No upcoming races found." };
    }
    return nextRace;
  } catch (error: any) {
    console.error("F1 Service Error:", error.message);
    return { error: "Failed to fetch F1 schedule." };
  }
}

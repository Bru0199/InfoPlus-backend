// import { createGoogleGenerativeAI } from "@ai-sdk/google";
// import { env } from "../env.ts";

// export const google = createGoogleGenerativeAI({
//   apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
// });

// export const geminiModel = google("gemini-2.5-flash");

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "../env.js";
import type { LanguageModel } from "ai";
const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

// export const geminiModel = openrouter("google/gemini-2.0-flash-exp:free");
export const geminiModel: LanguageModel = openrouter("xiaomi/mimo-v2-flash:free");

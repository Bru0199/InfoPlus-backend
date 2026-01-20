"use strict";
// import { createGoogleGenerativeAI } from "@ai-sdk/google";
// import { env } from "../env.ts";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiModel = void 0;
// export const google = createGoogleGenerativeAI({
//   apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
// });
// export const geminiModel = google("gemini-2.5-flash");
var ai_sdk_provider_1 = require("@openrouter/ai-sdk-provider");
var env_ts_1 = require("../env.ts");
var openrouter = (0, ai_sdk_provider_1.createOpenRouter)({
    apiKey: env_ts_1.env.OPENROUTER_API_KEY,
});
// export const geminiModel = openrouter("google/gemini-2.0-flash-exp:free");
exports.geminiModel = openrouter("xiaomi/mimo-v2-flash:free");

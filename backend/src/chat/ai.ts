/**
 * Chat layer: re-exports the AI model for chat use.
 * Model selection and client live in src/ai/ and src/config/.
 */

export { getChatModel } from "../ai/index.js";

/** @deprecated Use getChatModel() from "../ai/index.js". Kept for backward compatibility. */
import { getChatModel } from "../ai/index.js";
export const geminiModel = getChatModel();

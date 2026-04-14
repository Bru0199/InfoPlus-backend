import { ChatService } from "../services/chatService.js";
import { type Request, type Response } from "express";
import { logger } from "../utils/logger.js";
import { ChatAllModelsFailedError } from "./chatErrors.js";

export const chatHandler = async (req: Request, res: Response) => {
  try {
    const { messages, conversationId } = req.body;

    const userId = (req.user as any)?.id;

    if (!messages || !conversationId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { text: fullText, content } = await ChatService.processRequest(
      userId,
      conversationId,
      messages,
    );

    if (!res.headersSent) {
      return res.status(200).json({
        role: "assistant",
        content: (content && content.length > 0) ? content : (fullText ?? ""),
      });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const errMsg = err.message || "Internal Server Error";
    const errAny = error as Record<string, unknown> | null;
    const errStatus =
      (errAny?.status as number | undefined) ||
      (errAny?.response as { status?: number } | undefined)?.status;
    logger.error("Chat API Error:", errMsg);
    if (err.cause) logger.error("Chat API Error cause:", err.cause);
    const respData = (errAny?.response as { data?: unknown } | undefined)?.data;
    if (respData) logger.error("Chat API Error response:", respData);

    if (!res.headersSent) {
      const isAuth = errStatus === 401;
      const isAllModelsFailed =
        error instanceof ChatAllModelsFailedError ||
        (errAny?.code as string | undefined) === "CHAT_ALL_MODELS_FAILED";

      const lower = errMsg.toLowerCase();
      // Do NOT match generic English "model" — it matches "No model produced..." and misleads users.
      const isOpenRouterConfigHint =
        lower.includes("openrouter") ||
        lower.includes("no free models available") ||
        lower.includes("openrouter_api");

      const isDev = process.env.NODE_ENV === "development";

      const message = isDev
        ? errMsg
        : isAuth
          ? "Unauthorized"
          : isAllModelsFailed
            ? "All AI models failed to respond. Try again, or set OPENROUTER_MODEL in backend .env to a stable free model."
            : isOpenRouterConfigHint
              ? "AI provider error. Check OPENROUTER_MODEL and OPENROUTER_API_KEY in backend .env."
              : "Internal Server Error";

      return res.status(isAuth ? 401 : 500).json({
        error: "Chat request failed",
        message,
        ...(isAllModelsFailed ? { code: "CHAT_ALL_MODELS_FAILED" as const } : {}),
      });
    }
  }
};

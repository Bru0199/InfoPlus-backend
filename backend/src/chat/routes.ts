import { Router } from "express";
import { isAuthenticated } from "../auth/middleware.js";
import { logger } from "../utils/logger.js";

import { conversationService } from "../services/conversationService.js";
import { chatHandler } from "./chatHandler.js";

const router = Router();

router.post("/message", isAuthenticated, chatHandler);

router.get("/conversations", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const list = await conversationService.getUserConversations(userId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.delete(
  "/conversation/:conversationId",
  isAuthenticated,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = (req.user as any)?.id;

      if (!conversationId) {
        return res
          .status(400)
          .json({ success: false, message: "ID is required" });
      }

      const wasDeleted = await conversationService.deleteById(
        userId,
        conversationId as string,
      );

      if (wasDeleted) {
        logger.info(`Chat ${conversationId} removed.`);
        return res
          .status(200)
          .json({ success: true, message: "Deleted successfully" });
      } else {
        return res.status(404).json({
          success: false,
          message: "Conversation not found or unauthorized",
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Server error during deletion" });
    }
  },
);

router.get(
  "/conversation/:conversationId",
  isAuthenticated,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = (req.user as any)?.id;

      const messages = await conversationService.getMessagesByConversationId(
        userId,
        conversationId as string,
      );

      if (!messages || messages.length === 0) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.json(messages);
    } catch (error) {
      logger.error("Fetch Messages Error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  },
);

export default router;

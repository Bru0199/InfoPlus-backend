import { ChatService } from "../services/chatService.ts";
import { type Request, type Response } from "express";

export const maxDuration = 30;

export const chatHandler = async (req: Request, res: Response) => {
  try {
    const { messages, conversationId } = req.body;

    const userId = (req.user as any)?.id;

    if (!messages || !conversationId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await ChatService.processRequest(
      userId,
      conversationId,
      messages,
    );

    const streamResponse = result.toTextStreamResponse();

    const toolCalls = await result.toolCalls;

    // --- CONDITION: If no tools are called, use the Text Reader ---
    if (!toolCalls || toolCalls.length === 0) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      const streamResponse = result.toTextStreamResponse();
      const reader = streamResponse.body?.getReader();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      return res.end();
    }

    // --- CONDITION: If toolCalls exist, extract the JSON ---
    else {
      res.setHeader("Content-Type", "application/json");
      for await (const part of result.fullStream) {
        if (part.type === "tool-result") {
          const cleanOutput = (part as any).output;
          if (cleanOutput) {
            // Sends ONLY the clean JSON content
            res.write(JSON.stringify(cleanOutput));
          }
        }
      }
      return res.end();
    }
  } catch (error) {
    console.error("Chat API Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

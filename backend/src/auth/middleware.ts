import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.auth("Auth check:", {
    path: req.path,
    sessionID: req.sessionID,
    hasSession: !!req.session,
    isAuthenticated: req.isAuthenticated(),
    user: (req.user as any)?.email || null,
    cookies: req.cookies,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
    },
  });

  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({
    success: false,
    message: "Unauthorized: Please log in to use the AI chat.",
  });
};

import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({
    success: false,
    message: "Unauthorized: Please log in to use the AI chat.",
  });
};

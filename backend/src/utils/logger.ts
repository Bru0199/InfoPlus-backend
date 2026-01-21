/**
 * Logger Utility
 * Consistent logging across the application
 */

import { LOG_LEVELS } from "../constants/index.js";

type LogLevel = keyof typeof LOG_LEVELS;

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`${LOG_LEVELS.INFO} [INFO] ${message}`, data || "");
  },

  success: (message: string, data?: any) => {
    console.log(`${LOG_LEVELS.SUCCESS} ${message}`, data || "");
  },

  warn: (message: string, data?: any) => {
    console.warn(`${LOG_LEVELS.WARNING} [WARN] ${message}`, data || "");
  },

  error: (message: string, error?: any) => {
    console.error(`${LOG_LEVELS.ERROR} [ERROR] ${message}`);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    } else if (error) {
      console.error("Details:", error);
    }
  },

  db: (message: string, data?: any) => {
    console.log(`${LOG_LEVELS.DATABASE} ${message}`, data || "");
  },

  auth: (message: string, data?: any) => {
    console.log(`${LOG_LEVELS.SECURITY} ${message}`, data || "");
  },

  request: (method: string, path: string, data?: any) => {
    console.log(`${LOG_LEVELS.NETWORK} [${method}] ${path}`, data || "");
  },
};

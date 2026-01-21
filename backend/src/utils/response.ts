/**
 * Response Helper Utilities
 * Standardized API responses
 */

import type { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string,
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  } as ApiResponse<T>);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500,
): Response => {
  return res.status(statusCode).json({
    success: false,
    error,
  } as ApiResponse);
};

/**
 * Handle async route errors
 */
export const asyncHandler = (
  fn: (req: any, res: Response, next: any) => Promise<any>,
) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

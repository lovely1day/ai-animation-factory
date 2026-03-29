// ============================================================
// SECURITY NOTICE — DO NOT MODIFY WITHOUT REVIEW
// ============================================================
// This file enforces production error safety:
// - safeErrorMessage() hides internal details from users in production
// - errorHandler() catches all unhandled errors safely
// - AppError is for controlled, user-facing errors only
//
// RULES (from JL-PROJECT-STANDARDS.md):
// - NEVER send error.message directly to client in production
// - NEVER expose stack traces, SQL errors, or internal paths
// - ALWAYS use safeErrorMessage() in route catch blocks
// - ALWAYS log full error internally via logger
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.error({ err, req: req.path }, 'Operational error');
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  logger.error({ err, req: req.path }, 'Unexpected error');
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFound(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
}

export function safeErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV === 'production') return fallback;
  if (error instanceof Error) return error.message;
  return fallback;
}

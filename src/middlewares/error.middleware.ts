import { Request, Response, NextFunction } from "express";
import { fail } from "../utils/response";
import { logger } from "../utils/logger";

// Centralized error handler aligned with BACKEND_PLAN.md
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const isProd = process.env.NODE_ENV === "production";

  // Map known error types to codes/status
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";
  let details: unknown = undefined;

  if (err && typeof err === "object") {
    if (err.status && typeof err.status === "number") status = err.status;
    if (err.code && typeof err.code === "string") code = err.code;
    if (err.message && typeof err.message === "string") message = err.message;
    if (!isProd) details = err.stack || err;
  }

  // Handle common libraries
  if (err.name === "ValidationError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = err.message || "Validation failed";
    if (!isProd) details = err.errors || details;
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    status = 401;
    code = "UNAUTHORIZED";
    message = "Invalid or expired token";
  }

  // Log the error
  logger.error({ err, status, code }, message);
  res.status(status).json(fail(code, message, details));
}



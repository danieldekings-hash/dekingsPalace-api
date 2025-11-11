import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { fail } from "../utils/response";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(
        fail("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
      );
    }
    req.body = parsed.data as any;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json(
        fail("VALIDATION_ERROR", "Invalid query parameters", parsed.error.flatten())
      );
    }
    // Store validated query in a custom property since req.query is read-only
    (req as any).validatedQuery = parsed.data as any;
    next();
  };
}



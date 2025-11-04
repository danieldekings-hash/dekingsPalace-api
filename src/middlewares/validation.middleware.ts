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



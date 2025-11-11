import { z } from "zod";

export const createInvestmentSchema = z.object({
  plan: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["USDT"]),
});

export const listInvestmentsQuerySchema = z.object({
  status: z.enum(["all", "active", "completed", "pending", "cancelled"]).default("all").optional(),
  sortBy: z.enum(["startDate", "amount", "planName", "status"]).default("startDate").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export const patchInvestmentSchema = z.object({
  action: z.enum(["pause", "resume"]),
});

export const exportInvestmentsQuerySchema = z.object({
  format: z.enum(["csv", "xlsx"]).default("csv").optional(),
  status: z.enum(["all", "active", "completed", "pending", "cancelled"]).optional(),
  sortBy: z.enum(["startDate", "amount", "planName", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});



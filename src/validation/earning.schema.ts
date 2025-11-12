import { z } from "zod";

export const listEarningsSchema = z.object({
  type: z.enum(["investment_earning", "referral_bonus", "all"]).optional(),
  isWithdrawn: z
    .preprocess(
      (val) => {
        if (val === "true" || val === true) return true;
        if (val === "false" || val === false) return false;
        return undefined;
      },
      z.boolean().optional()
    )
    .optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(["date", "amount", "withdrawableDate"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const withdrawEarningsSchema = z.object({
  amount: z.number().positive().min(0.01),
  currency: z.enum(["USDT"]).default("USDT"),
  walletAddress: z.string().min(10, "Wallet address must be at least 10 characters"),
});

export const dailyBreakdownQuerySchema = z.object({
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/,
      "start must be in YYYY-MM-DD format")
    .optional(),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/,
      "end must be in YYYY-MM-DD format")
    .optional(),
});


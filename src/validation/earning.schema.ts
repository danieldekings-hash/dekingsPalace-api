import { z } from "zod";

export const listEarningsSchema = z.object({
  type: z.enum(["investment_earning", "referral_bonus", "all"]).optional(),
  isWithdrawn: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  sortBy: z.enum(["date", "amount", "withdrawableDate"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const withdrawEarningsSchema = z.object({
  amount: z.number().positive().min(0.01),
  currency: z.enum(["USDT"]).default("USDT"),
  walletAddress: z.string().min(10, "Wallet address must be at least 10 characters"),
});


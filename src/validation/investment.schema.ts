import { z } from "zod";

export const createInvestmentSchema = z.object({
  planId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["BTC", "ETH", "USDT"]),
});



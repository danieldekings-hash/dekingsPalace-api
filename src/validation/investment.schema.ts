import { z } from "zod";

export const createInvestmentSchema = z.object({
  plan: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["USDT"]),
});



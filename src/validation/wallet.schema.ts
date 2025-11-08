import { z } from "zod";

export const depositSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["BTC", "ETH", "USDT"]),
  transactionHash: z.string().min(1).optional(),
});

export const withdrawSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["BTC", "ETH", "USDT"]),
  walletAddress: z.string().min(10),
});



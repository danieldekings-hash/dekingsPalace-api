import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(1),
  tier: z.enum(["Bronze", "Silver", "Gold", "Platinum", "Diamond"]),
  description: z.string().optional(),
  minAmount: z.number().min(0),
  maxAmount: z.number().min(0),
  percentage: z.number().min(0).max(100),
  duration: z.number().int().min(1),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const updatePlanSchema = createPlanSchema.partial();



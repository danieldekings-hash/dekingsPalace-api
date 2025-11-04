import { Schema, model, Document } from "mongoose";

export interface IPlan extends Document {
  name: string;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  description?: string;
  minAmount: number;
  maxAmount: number; // 0 = unlimited
  percentage: number; // daily ROI percentage
  duration: number; // in days
  features?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    tier: { type: String, enum: ["Bronze", "Silver", "Gold", "Platinum", "Diamond"], required: true },
    description: { type: String },
    minAmount: { type: Number, required: true, min: 0 },
    maxAmount: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    duration: { type: Number, required: true, min: 1 },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique index on `name` is already defined via the schema path (unique: true)
PlanSchema.index({ tier: 1 });
PlanSchema.index({ isActive: 1 });

export const Plan = model<IPlan>("Plan", PlanSchema);



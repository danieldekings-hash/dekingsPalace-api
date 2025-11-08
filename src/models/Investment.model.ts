import { Schema, model, Document } from "mongoose";

export interface IInvestment extends Document {
  userId: Schema.Types.ObjectId;
  plan: string;
  amount: number;
  status: "pending" | "active" | "completed" | "cancelled";
  startDate?: Date;
  endDate?: Date;
  returns?: number; // Monthly return amount (earned each month)
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    returns: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for faster queries
InvestmentSchema.index({ userId: 1, status: 1 });
InvestmentSchema.index({ createdAt: -1 });

export const Investment = model<IInvestment>("Investment", InvestmentSchema);

import { Schema, model, Document } from "mongoose";

export interface IEarning extends Document {
  userId: Schema.Types.ObjectId;
  investmentId?: Schema.Types.ObjectId; // Optional for referral bonuses
  type: "investment_earning" | "referral_bonus";
  amount: number;
  date: Date; // earning date (UTC, start of day)
  withdrawableDate: Date; // Date when earnings can be withdrawn (1 month after earning date)
  isWithdrawn: boolean;
  withdrawalTransactionId?: Schema.Types.ObjectId; // Reference to withdrawal transaction
  // For referral bonuses
  referredUserId?: Schema.Types.ObjectId; // User who made the investment that triggered this bonus
  referralTier?: string; // Tier of the referrer (GOLD, DIAMOND, etc.)
  referralPercentage?: number; // Percentage used for this bonus
  createdAt: Date;
  updatedAt: Date;
}

const EarningSchema = new Schema<IEarning>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    investmentId: { type: Schema.Types.ObjectId, ref: "Investment", index: true },
    type: {
      type: String,
      enum: ["investment_earning", "referral_bonus"],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    withdrawableDate: { type: Date, required: true, index: true },
    isWithdrawn: { type: Boolean, default: false, index: true },
    withdrawalTransactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    // Referral bonus fields
    referredUserId: { type: Schema.Types.ObjectId, ref: "User" },
    referralTier: { type: String },
    referralPercentage: { type: Number },
  },
  { timestamps: true }
);

// Index for unique investment earnings per day
EarningSchema.index({ investmentId: 1, date: 1, type: 1 }, { unique: true, partialFilterExpression: { investmentId: { $exists: true } } });

// Index for querying withdrawable earnings
EarningSchema.index({ userId: 1, isWithdrawn: 1, withdrawableDate: 1 });

export const Earning = model<IEarning>("Earning", EarningSchema);



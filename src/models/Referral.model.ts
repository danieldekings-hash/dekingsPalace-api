import { Schema, model, Document } from "mongoose";

export interface IReferral extends Document {
  referrerId: Schema.Types.ObjectId;
  referredId: Schema.Types.ObjectId;
  referralCode: string;
  level: number; // 1..10
  status: "pending" | "active" | "inactive";
  totalEarnings: number;
  currency: "USDT";
  lastEarningDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referredId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    referralCode: { type: String, required: true },
    level: { type: Number, default: 1, min: 1, max: 10 },
    status: { type: String, enum: ["pending", "active", "inactive"], default: "pending" },
    totalEarnings: { type: Number, default: 0 },
    currency: { type: String, enum: ["USDT"], default: "USDT" },
    lastEarningDate: { type: Date },
  },
  { timestamps: true }
);

ReferralSchema.index({ referrerId: 1, status: 1 });

export const Referral = model<IReferral>("Referral", ReferralSchema);



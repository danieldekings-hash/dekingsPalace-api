import { Schema, model, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: Schema.Types.ObjectId;
  type: "deposit" | "withdrawal" | "profit";
  amount: number;
  currency: string;
  address?: string;
  reference: string;
  status: "waiting_payment" | "pending" | "confirmed" | "failed" | "cancelled";
  txHash?: string;
  confirmations?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "profit"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true },
    address: { type: String },
    reference: { type: String, required: true },
    status: {
      type: String,
      enum: ["waiting_payment", "pending", "confirmed", "failed", "cancelled"],
      default: "pending",
    },
    txHash: { type: String },
    confirmations: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for faster queries
TransactionSchema.index({ userId: 1, status: 1 });
TransactionSchema.index({ reference: 1 }, { unique: true });
TransactionSchema.index({ txHash: 1 });
TransactionSchema.index({ createdAt: -1 });

export const Transaction = model<ITransaction>("Transaction", TransactionSchema);

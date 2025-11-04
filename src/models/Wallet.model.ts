import { Schema, model, Document } from "mongoose";

export interface IWallet extends Document {
  userId: Schema.Types.ObjectId;
  balances: { BTC: number; ETH: number; USDT: number };
  addresses: { BTC?: string; ETH?: string; USDT?: string };
  totalDeposited: { BTC: number; ETH: number; USDT: number };
  totalWithdrawn: { BTC: number; ETH: number; USDT: number };
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    balances: {
      BTC: { type: Number, default: 0 },
      ETH: { type: Number, default: 0 },
      USDT: { type: Number, default: 0 },
    },
    addresses: {
      BTC: { type: String },
      ETH: { type: String },
      USDT: { type: String },
    },
    totalDeposited: {
      BTC: { type: Number, default: 0 },
      ETH: { type: Number, default: 0 },
      USDT: { type: Number, default: 0 },
    },
    totalWithdrawn: {
      BTC: { type: Number, default: 0 },
      ETH: { type: Number, default: 0 },
      USDT: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Wallet = model<IWallet>("Wallet", WalletSchema);



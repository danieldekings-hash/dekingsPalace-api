import { Schema, model, Document } from "mongoose";

export interface IWalletTx extends Document {
  hash: string;
  network: "bep20" | "tron" | "solana";
  amount: number;
  from: string;
  to: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTxSchema = new Schema<IWalletTx>(
  {
    hash: { type: String, required: true, unique: true, index: true },
    network: { type: String, enum: ["bep20", "tron", "solana"], required: true },
    amount: { type: Number, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const WalletTx = model<IWalletTx>("WalletTx", WalletTxSchema);


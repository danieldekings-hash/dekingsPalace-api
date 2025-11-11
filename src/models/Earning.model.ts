import { Schema, model, Document } from "mongoose";

export interface IEarning extends Document {
  userId: Schema.Types.ObjectId;
  investmentId: Schema.Types.ObjectId;
  amount: number;
  date: Date; // earning date (UTC, start of day)
  createdAt: Date;
  updatedAt: Date;
}

const EarningSchema = new Schema<IEarning>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    investmentId: { type: Schema.Types.ObjectId, ref: "Investment", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

EarningSchema.index({ investmentId: 1, date: 1 }, { unique: true });

export const Earning = model<IEarning>("Earning", EarningSchema);



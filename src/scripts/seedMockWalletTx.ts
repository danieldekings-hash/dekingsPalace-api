import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db";
import { WalletTx } from "../models/WalletTx.model";

dotenv.config();

async function main() {
  await connectDB();

  const mockHash = `manual-mock-${Date.now()}`;

  await WalletTx.create({
    hash: mockHash,
    network: "tron",
    amount: 12.34,
    from: "TEST_MANUAL_SENDER",
    to: "TMG5F5YTYShrMCZnZkDpGY2LhJwdHVwMMK",
    timestamp: new Date(),
  });

  // eslint-disable-next-line no-console
  console.log(`Inserted manual mock WalletTx with hash ${mockHash}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to seed manual WalletTx", err);
  process.exitCode = 1;
});



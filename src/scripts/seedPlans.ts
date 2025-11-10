import dotenv from "dotenv";
import connectDB from "../config/db";
import { Plan } from "../models/Plan.model";

dotenv.config();

async function run() {
  try {
    await connectDB();

    const seeds = [
      {
        name: "Bronze Plan",
        tier: "Bronze",
        minAmount: 20,
        maxAmount: 50,
        percentage: 5, // monthly ROI percentage
        duration: 30, // days
        features: ["Stable monthly ROI"],
        isActive: true,
      },
      {
        name: "Silver Plan",
        tier: "Silver",
        minAmount: 51,
        maxAmount: 100,
        percentage: 8,
        duration: 30,
        features: ["Higher cap", "Stable monthly ROI"],
        isActive: true,
      },
      {
        name: "Gold Plan",
        tier: "Gold",
        minAmount: 101,
        maxAmount: 500,
        percentage: 10,
        duration: 30,
        features: ["Premium support", "Stable monthly ROI"],
        isActive: true,
      },
      {
        name: "Platinum Plan",
        tier: "Platinum",
        minAmount: 501,
        maxAmount: 5000,
        percentage: 15,
        duration: 30,
        features: ["Priority processing", "Higher ROI"],
        isActive: true,
      },
      {
        name: "Diamond Plan",
        tier: "Diamond",
        minAmount: 5001,
        maxAmount: 0, // 0 = unlimited per model comment
        percentage: 20,
        duration: 30,
        features: ["Top-tier ROI", "VIP support"],
        isActive: true,
      },
    ] as const;

    let upserted = 0;
    for (const s of seeds) {
      const res = await Plan.updateOne(
        { name: s.name },
        { $set: s },
        { upsert: true }
      );
      // Count either an insert or a modification as upserted/updated
      if ((res.upsertedCount ?? 0) > 0 || (res.modifiedCount ?? 0) > 0) {
        upserted += 1;
      }
    }

    // Ensure only these plans are active (optional): skip deleting to avoid surprises
    // You can deactivate unknown plans if needed.

    // eslint-disable-next-line no-console
    console.log(`Seed complete. Upserted/updated ${upserted} plans.`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Plan seed failed:", err);
    process.exitCode = 1;
  } finally {
    // Close the mongoose connection cleanly
    const mongoose = (await import("mongoose")).default;
    await mongoose.connection.close().catch(() => {});
  }
}

run();



import cron from "node-cron";
import { runDailyInvestmentEarningsJob } from "../services/earning.service";
import { checkAllWalletDeposits } from "../services/wallet-tracking.service";

// Schedule: 00:05 UTC every day
// Cron expression fields: minute hour day-of-month month day-of-week
// Using UTC: node-cron runs on server local time. If your server is not UTC, consider using
// a timezone option like { timezone: 'UTC' } below.

export function initSchedulers() {
  // Daily investment earnings job at 00:05 UTC
  cron.schedule("5 0 * * *", async () => {
    try {
      await runDailyInvestmentEarningsJob();
      // eslint-disable-next-line no-console
      console.log("[cron] Daily investment earnings upsert completed");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[cron] Daily investment earnings upsert failed", err);
    }
  }, { timezone: "UTC" });

  // Wallet tracking: Check for deposits every 10 seconds
  // Using setInterval for sub-minute intervals. Currently only TRON and Solana are tracked.
  setInterval(async () => {
    try {
      await checkAllWalletDeposits();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[cron] Wallet tracking check failed", err);
    }
  }, 10000); // 10 seconds = 10000 milliseconds

  // eslint-disable-next-line no-console
  console.log("[cron] Wallet tracking initialized (checking every 10 seconds)");
}

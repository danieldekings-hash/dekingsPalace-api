import cron from "node-cron";
import { runDailyInvestmentEarningsJob } from "../services/earning.service";

// Schedule: 00:05 UTC every day
// Cron expression fields: minute hour day-of-month month day-of-week
// Using UTC: node-cron runs on server local time. If your server is not UTC, consider using
// a timezone option like { timezone: 'UTC' } below.

export function initSchedulers() {
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
}

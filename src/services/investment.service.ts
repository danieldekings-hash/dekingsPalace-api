import { Investment } from "../models/Investment.model";
import { Transaction } from "../models/Transaction.model";
import { User } from "../models/User.model";
import { Wallet } from "../models/Wallet.model";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";
import { CreateInvestmentDTO, InvestmentResponse, InvestmentError } from "../types";
import {
  validateInvestmentPlan,
  getPlanConfig,
  calculateInvestmentReturn,
} from "../constants/investment.plans";
import { INVESTMENT_PLANS, InvestmentPlan } from "../constants/investment.plans";
import { Earning } from "../models/Earning.model";
import { awardReferralBonus } from "./referral-bonus.service";

/**
 * Creates a new investment by deducting from user's wallet
 * Returns are calculated on a monthly basis based on the investment plan
 * @param data - Investment creation data
 * @returns Promise<InvestmentResponse | InvestmentError>
 */
export const createInvestment = async ({
  userId,
  plan,
  amount,
  currency,
}: CreateInvestmentDTO): Promise<InvestmentResponse | InvestmentError> => {
  // Validate input amount
  if (!amount || amount <= 0) {
    return { status: 400, message: "Invalid investment amount. Amount must be greater than 0." };
  }

  // Validate investment plan
  const planConfig = getPlanConfig(plan);
  if (!planConfig) {
    return {
      status: 400,
      message: `Invalid investment plan. Available plans: bronze, silver, gold, platinum, diamond.`,
    };
  }

  // Validate amount matches plan range
  if (!validateInvestmentPlan(plan, amount)) {
    return {
      status: 400,
      message: `Investment amount $${amount} does not match ${planConfig.name} range ($${planConfig.minAmount}-$${planConfig.maxAmount === Infinity ? "∞" : planConfig.maxAmount}).`,
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find user and lock the document to prevent race conditions
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return { status: 404, message: "User not found" };
    }

    // Load user's on-chain wallet (USDT is treated as USD balance for investments)
    let wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) {
      // If wallet doesn't exist yet, user effectively has 0 balance
      await session.abortTransaction();
      return {
        status: 400,
        message: `Insufficient wallet balance. Available: $0.00, Required: $${amount.toFixed(2)}.`,
      };
    }

    // Normalize currency and enforce USDT for investment denomination
    const denoCurrency = (currency || "USDT").toUpperCase() as "USDT" | "BTC" | "ETH";
    const spendCurrency: "USDT" = "USDT";

    // Check wallet balance in USDT
    const available = Number(wallet.balances?.[spendCurrency] || 0);
    if (available < amount) {
      await session.abortTransaction();
      return {
        status: 400,
        message: `Insufficient wallet balance. Available: $${available.toFixed(
          2
        )}, Required: $${amount.toFixed(2)}.`,
      };
    }

    // Calculate monthly return (earnings per month)
    const monthlyReturn = calculateInvestmentReturn(amount, plan);
    const returnPercentage = planConfig.returnPercentage;

    // Generate reference for transaction
    const reference = `inv_${uuid()}`;

    // Deduct amount from wallet USDT balance (atomic operation)
    wallet.balances[spendCurrency] = available - amount;
    await wallet.save({ session });

    // Calculate investment duration (30 days = 1 month)
    // Returns are paid monthly, so the investment runs for at least 1 month
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30 days = 1 month


    const investment = await Investment.create(
      [
        {
          userId,
          plan: plan.toLowerCase(),
          amount,
          status: "active",
          startDate,
          endDate,
          returns: monthlyReturn, // Monthly return amount
        },
      ],
      { session }
    );

    const investmentId = String(investment[0]._id);

    // Create transaction record for the wallet deduction
    await Transaction.create(
      [
        {
          userId,
          type: "withdrawal",
          amount,
          currency: spendCurrency,
          reference,
          status: "confirmed",
          txHash: `wallet_deduction_${reference}`,
          confirmations: 1,
        },
      ],
      { session }
    );

    // Award referral bonus if user was referred
    await awardReferralBonus(
      userId,
      investmentId,
      amount,
      plan.toLowerCase(),
      session
    );

    // Commit transaction
    await session.commitTransaction();

    return {
      investmentId,
      reference,
      message: `Investment created successfully. ${planConfig.name} activated. You will earn $${monthlyReturn.toFixed(2)} monthly (${returnPercentage}% per month).`,
      plan: planConfig.name,
      amount,
      expectedReturn: monthlyReturn, // Monthly return amount
      returnPercentage, // Monthly return percentage
      startDate,
      endDate,
      walletBalance: Number(wallet.balances?.[spendCurrency] || 0),
    };
  } catch (error: any) {
    // Rollback transaction on error
    await session.abortTransaction();
    console.error("Investment creation error:", error);
    return {
      status: 500,
      message: error.message || "Failed to create investment. Please try again.",
    };
  } finally {
    session.endSession();
  }
};

type ListQuery = {
  status?: "all" | "active" | "completed" | "pending" | "cancelled";
  sortBy?: "startDate" | "amount" | "planName" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

function computeStatus(inv: any, now = new Date()): "pending" | "active" | "completed" | "cancelled" {
  if (inv.status === "cancelled") return "cancelled";
  if (!inv.startDate || now < inv.startDate) return "pending";
  if (inv.endDate && now >= inv.endDate) return "completed";
  return "active";
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function computeNextMonthlyPayout(startDate?: Date | null, now = new Date()) {
  if (!startDate) return null;
  // Payout every 30 days from startDate
  const cycleDays = 30;
  let next = new Date(startDate);
  while (next <= now) {
    next = addDays(next, cycleDays);
  }
  return next.toISOString();
}

function computeDerived(inv: any, earningsSum = 0) {
  const planKey = String(inv.plan).toLowerCase() as keyof typeof InvestmentPlan;
  const cfg = getPlanConfig(planKey as any);
  const name = cfg?.name ?? inv.plan;
  const tier = name.split(" ")[0]; // Bronze, Silver, etc.
  const planPercentage = cfg?.returnPercentage ?? 0;
  const currency = "USDT";
  const startDate = inv.startDate ?? null;
  const endDate = inv.endDate ?? null;
  const status = computeStatus(inv);
  const dailyReturn = cfg ? (inv.amount * (cfg.returnPercentage / 100)) / 30 : 0;
  const expectedReturn = cfg ? inv.amount + inv.amount * (cfg.returnPercentage / 100) : inv.amount;
  const totalEarnings = earningsSum;
  const now = new Date();
  const daysRemaining =
    endDate && now < endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const nextPayout = computeNextMonthlyPayout(startDate, now);

  return {
    id: String(inv._id),
    planName: name,
    planTier: tier,
    amount: inv.amount,
    currency,
    startDate,
    endDate,
    status,
    dailyReturn,
    totalEarnings,
    expectedReturn,
    planPercentage,
    daysRemaining,
    nextPayout,
  };
}

export async function listInvestments(userId: string, query: ListQuery) {
  const { status = "all", sortBy = "startDate", sortOrder = "desc", page = 1, pageSize = 20 } = query || {};
  const filter: any = { userId };
  if (status !== "all") {
    filter.status = status;
  }
  const sort: any = {};
  if (sortBy === "planName") sort.plan = sortOrder === "asc" ? 1 : -1;
  else sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    Investment.find(filter).sort(sort).skip(skip).limit(pageSize).lean(),
    Investment.countDocuments(filter),
  ]);

  const ids = items.map((i) => i._id);
  const earnings = await Earning.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), investmentId: { $in: ids } } },
    { $group: { _id: "$investmentId", total: { $sum: "$amount" } } },
  ]);
  const earningsMap = new Map<string, number>(earnings.map((e: any) => [String(e._id), e.total]));
  const data = items.map((inv) => computeDerived(inv, earningsMap.get(String(inv._id)) || 0));
  return { data, meta: { total, page, pageSize } };
}

export async function getInvestmentById(userId: string, id: string) {
  const inv = await Investment.findOne({ _id: id, userId }).lean();
  if (!inv) return null;
  const sum = await Earning.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), investmentId: new mongoose.Types.ObjectId(id) } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const total = sum[0]?.total || 0;
  return computeDerived(inv, total);
}

export async function getInvestmentsSummary(userId: string) {
  const items = await Investment.find({ userId }).lean();
  const ids = items.map((i) => i._id);
  const earnings = await Earning.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), investmentId: { $in: ids } } },
    { $group: { _id: "$investmentId", total: { $sum: "$amount" } } },
  ]);
  const earningsMap = new Map<string, number>(earnings.map((e: any) => [String(e._id), e.total]));
  const derived = items.map((inv) => computeDerived(inv, earningsMap.get(String(inv._id)) || 0));
  const totalInvested = derived.reduce((s, i) => s + i.amount, 0);
  const totalEarnings = derived.reduce((s, i) => s + i.totalEarnings, 0);
  const dailyEarnings = derived.reduce((s, i) => s + i.dailyReturn, 0);
  const expectedTotalReturn = derived.reduce((s, i) => s + i.expectedReturn, 0);
  const activeCount = derived.filter((i) => i.status === "active").length;
  const totalCount = derived.length;
  return { totalInvested, totalEarnings, dailyEarnings, expectedTotalReturn, activeCount, totalCount };
}

export async function patchInvestment(
  userId: string,
  id: string,
  action: "pause" | "resume"
): Promise<any | InvestmentError> {
  const inv = await Investment.findOne({ _id: id, userId });
  if (!inv) return { status: 404, message: "Investment not found" };
  if (action === "pause") {
    if (inv.status !== "active") return { status: 400, message: "Only active investments can be paused" };
    inv.status = "pending"; // treating pause as pending for now
  } else {
    if (inv.status !== "pending") return { status: 400, message: "Only pending investments can be resumed" };
    inv.status = "active";
  }
  await inv.save();
  return computeDerived(inv.toObject());
}

export async function exportInvestments(userId: string, query: any) {
  const { format = "csv" } = query || {};
  const { data } = await listInvestments(userId, query);
  if (format === "xlsx") {
    // Minimal in-memory XLSX (CSV masquerade) for now
    const header = Object.keys(data[0] || {}).join(",");
    const rows = data.map((r) => Object.values(r).join(","));
    const csv = [header, ...rows].join("\n");
    return { buffer: csv, mime: "text/csv", filename: "investments.csv" };
  }
  const header = Object.keys(data[0] || {}).join(",");
  const rows = data.map((r) => Object.values(r).join(","));
  const csv = [header, ...rows].join("\n");
  return { buffer: csv, mime: "text/csv", filename: "investments.csv" };
}

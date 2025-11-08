import { Investment } from "../models/Investment.model";
import { Transaction } from "../models/Transaction.model";
import { User } from "../models/User.model";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";
import { CreateInvestmentDTO, InvestmentResponse, InvestmentError } from "../types";
import {
  validateInvestmentPlan,
  getPlanConfig,
  calculateInvestmentReturn,
} from "../constants/investment.plans";

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

    // Check wallet balance
    if (user.walletBalance < amount) {
      await session.abortTransaction();
      return {
        status: 400,
        message: `Insufficient wallet balance. Available: $${user.walletBalance.toFixed(2)}, Required: $${amount.toFixed(2)}.`,
      };
    }

    // Calculate monthly return (earnings per month)
    const monthlyReturn = calculateInvestmentReturn(amount, plan);
    const returnPercentage = planConfig.returnPercentage;

    // Generate reference for transaction
    const reference = `inv_${uuid()}`;

    // Deduct amount from wallet (atomic operation)
    user.walletBalance -= amount;
    await user.save({ session });

    // Calculate investment duration (30 days = 1 month)
    // Returns are paid monthly, so the investment runs for at least 1 month
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30 days = 1 month

    // Create investment record
    // returns field stores the monthly return amount
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
          currency: currency.toUpperCase(),
          reference,
          status: "confirmed",
          txHash: `wallet_deduction_${reference}`,
          confirmations: 1,
        },
      ],
      { session }
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
      walletBalance: user.walletBalance,
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

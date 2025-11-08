import { User } from "../models/User.model";
import { Transaction } from "../models/Transaction.model";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";

export interface CreateDepositDTO {
  userId: string;
  amount: number;
  currency: string;
  reference?: string;
}

export interface DepositResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  reference?: string;
  walletBalance?: number;
  status?: number;
}

/**
 * Manually deposit funds into user's wallet
 * This is for testing purposes - in production, this would be triggered by blockchain confirmation
 * @param data - Deposit data
 * @returns DepositResponse
 */
export const createManualDeposit = async (data: CreateDepositDTO): Promise<DepositResponse> => {
  // Validate input
  if (!data.amount || data.amount <= 0) {
    return {
      success: false,
      message: "Invalid deposit amount. Amount must be greater than 0.",
      status: 400,
    };
  }

  if (!data.userId) {
    return {
      success: false,
      message: "User ID is required",
      status: 400,
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find user
    const user = await User.findById(data.userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return {
        success: false,
        message: "User not found",
        status: 404,
      };
    }

    // Generate reference if not provided
    const reference = data.reference || `dep_${uuid()}`;

    // Create deposit transaction record
    const transaction = await Transaction.create(
      [
        {
          userId: data.userId,
          type: "deposit",
          amount: data.amount,
          currency: data.currency.toUpperCase(),
          reference,
          status: "confirmed", // Manual deposits are immediately confirmed
          txHash: `manual_deposit_${reference}`,
          confirmations: 1,
        },
      ],
      { session }
    );

    // Update user wallet balance
    user.walletBalance = (user.walletBalance || 0) + data.amount;
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();

    return {
      success: true,
      message: `Deposit of ${data.amount} ${data.currency.toUpperCase()} successful`,
      transactionId: String(transaction[0]._id),
      reference,
      walletBalance: user.walletBalance,
      status: 200,
    };
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Manual deposit error:", error);
    return {
      success: false,
      message: error.message || "Failed to process deposit",
      status: 500,
    };
  } finally {
    session.endSession();
  }
};

/**
 * Get user wallet balance
 * @param userId - User ID
 * @returns Wallet balance info
 */
export const getWalletBalance = async (userId: string): Promise<{
  success: boolean;
  walletBalance?: number;
  message?: string;
  status?: number;
}> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
        status: 404,
      };
    }

    return {
      success: true,
      walletBalance: user.walletBalance || 0,
      status: 200,
    };
  } catch (error: any) {
    console.error("Get wallet balance error:", error);
    return {
      success: false,
      message: error.message || "Failed to get wallet balance",
      status: 500,
    };
  }
};


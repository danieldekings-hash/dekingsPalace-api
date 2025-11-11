import { Earning } from "../models/Earning.model";
import { Wallet } from "../models/Wallet.model";
import { Transaction } from "../models/Transaction.model";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

export interface EarningsListQuery {
  type?: "investment_earning" | "referral_bonus" | "all";
  isWithdrawn?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "date" | "amount" | "withdrawableDate";
  sortOrder?: "asc" | "desc";
}

export interface EarningsSummary {
  totalEarnings: number;
  totalWithdrawn: number;
  totalAvailable: number;
  investmentEarnings: number;
  referralBonuses: number;
  withdrawableAmount: number;
  pendingAmount: number;
}

/**
 * Lists all earnings for a user with filtering and pagination
 */
export async function listEarnings(userId: string, query: EarningsListQuery = {}) {
  const {
    type = "all",
    isWithdrawn,
    page = 1,
    pageSize = 20,
    sortBy = "date",
    sortOrder = "desc",
  } = query;

  const filter: any = { userId: new mongoose.Types.ObjectId(userId) };

  // Filter by type
  if (type !== "all") {
    filter.type = type;
  }

  // Filter by withdrawal status
  if (isWithdrawn !== undefined) {
    filter.isWithdrawn = isWithdrawn;
  }

  // Build sort object
  const sort: any = {};
  if (sortBy === "date") {
    sort.date = sortOrder === "asc" ? 1 : -1;
  } else if (sortBy === "amount") {
    sort.amount = sortOrder === "asc" ? 1 : -1;
  } else if (sortBy === "withdrawableDate") {
    sort.withdrawableDate = sortOrder === "asc" ? 1 : -1;
  }

  const skip = (page - 1) * pageSize;

  const [earnings, total] = await Promise.all([
    Earning.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .populate("investmentId", "plan amount")
      .populate("referredUserId", "fullName email")
      .lean(),
    Earning.countDocuments(filter),
  ]);

  // Format earnings for response
  const formattedEarnings = earnings.map((earning) => ({
    id: String(earning._id),
    type: earning.type,
    amount: earning.amount,
    date: earning.date,
    withdrawableDate: earning.withdrawableDate,
    isWithdrawn: earning.isWithdrawn,
    withdrawalTransactionId: earning.withdrawalTransactionId
      ? String(earning.withdrawalTransactionId)
      : null,
    // Investment earning details
    investmentId: earning.investmentId ? String(earning.investmentId) : null,
    investment: earning.investmentId
      ? {
          plan: (earning.investmentId as any).plan,
          amount: (earning.investmentId as any).amount,
        }
      : null,
    // Referral bonus details
    referredUserId: earning.referredUserId ? String(earning.referredUserId) : null,
    referredUser: earning.referredUserId
      ? {
          fullName: (earning.referredUserId as any).fullName,
          email: (earning.referredUserId as any).email,
        }
      : null,
    referralTier: earning.referralTier,
    referralPercentage: earning.referralPercentage,
    createdAt: earning.createdAt,
    updatedAt: earning.updatedAt,
  }));

  return {
    earnings: formattedEarnings,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Gets earnings summary for a user
 */
export async function getEarningsSummary(userId: string): Promise<EarningsSummary> {
  const userIdObj = new mongoose.Types.ObjectId(userId);

  // Aggregate earnings by type and withdrawal status
  const earningsAgg = await Earning.aggregate([
    { $match: { userId: userIdObj } },
    {
      $group: {
        _id: {
          type: "$type",
          isWithdrawn: "$isWithdrawn",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  // Calculate totals
  let totalEarnings = 0;
  let totalWithdrawn = 0;
  let investmentEarnings = 0;
  let referralBonuses = 0;
  let withdrawableAmount = 0;
  let pendingAmount = 0;

  const now = new Date();

  earningsAgg.forEach((item) => {
    const amount = item.total;
    totalEarnings += amount;

    if (item._id.type === "investment_earning") {
      investmentEarnings += amount;
    } else if (item._id.type === "referral_bonus") {
      referralBonuses += amount;
    }

    if (item._id.isWithdrawn) {
      totalWithdrawn += amount;
    } else {
      pendingAmount += amount;
    }
  });

  // Calculate withdrawable amount (earnings that are not withdrawn and past complete 30 days)
  const withdrawableEarnings = await Earning.aggregate([
    {
      $match: {
        userId: userIdObj,
        isWithdrawn: false,
        withdrawableDate: { $lt: now }, // Complete 30 days (strictly less than now)
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  withdrawableAmount = withdrawableEarnings[0]?.total || 0;
  const totalAvailable = totalEarnings - totalWithdrawn;

  return {
    totalEarnings,
    totalWithdrawn,
    totalAvailable,
    investmentEarnings,
    referralBonuses,
    withdrawableAmount,
    pendingAmount,
  };
}

/**
 * Creates a withdrawal request for available earnings (earnings that are past the 1-month window)
 * The withdrawal will be processed manually by admin
 */
export async function withdrawEarnings(
  userId: string,
  amount: number,
  currency: string = "USDT",
  walletAddress: string
): Promise<{ reference: string; transactionId: string; message: string }> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const now = new Date();

    // Find all withdrawable earnings (not withdrawn, past complete 30 days, and not already linked to a pending withdrawal)
    // withdrawableDate must be strictly less than now (complete 30 days have passed since earning date)
    const withdrawableEarnings = await Earning.find({
      userId: userIdObj,
      isWithdrawn: false,
      withdrawableDate: { $lt: now }, // Strictly less than now (complete 30 days)
      $or: [
        { withdrawalTransactionId: { $exists: false } },
        { withdrawalTransactionId: null },
      ],
    })
      .sort({ withdrawableDate: 1 }) // Oldest first
      .session(session);

    if (withdrawableEarnings.length === 0) {
      await session.abortTransaction();
      const err: any = new Error("No earnings available for withdrawal. Earnings can only be withdrawn after complete 30 days from the earning date.");
      err.code = "NO_WITHDRAWABLE_EARNINGS";
      throw err;
    }

    // Check if any earnings are linked to pending transactions (reserved for other withdrawal requests)
    const earningsWithPendingTx = await Earning.aggregate([
      {
        $match: {
          userId: userIdObj,
          isWithdrawn: false,
          withdrawableDate: { $lt: now }, // Complete 30 days
          withdrawalTransactionId: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: "transactions",
          localField: "withdrawalTransactionId",
          foreignField: "_id",
          as: "transaction",
        },
      },
      {
        $match: {
          "transaction.status": { $in: ["pending", "processing"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]).session(session);

    const reservedAmount = earningsWithPendingTx[0]?.total || 0;

    // Calculate total available (excluding reserved earnings)
    const totalAvailable = withdrawableEarnings.reduce((sum, e) => {
      // Check if this earning is reserved
      const isReserved = e.withdrawalTransactionId && 
        withdrawableEarnings.some(ew => String(ew._id) === String(e._id));
      return isReserved ? sum : sum + e.amount;
    }, 0) - reservedAmount;

    if (amount > totalAvailable) {
      await session.abortTransaction();
      const err: any = new Error(
        `Insufficient withdrawable earnings. Available: ${totalAvailable.toFixed(2)}, Requested: ${amount.toFixed(2)}. Note: Earnings can only be withdrawn after complete 30 days from the earning date.`
      );
      err.code = "INSUFFICIENT_EARNINGS";
      throw err;
    }

    // Reserve earnings for this withdrawal (FIFO - oldest first)
    // We'll link them to the transaction but NOT mark as withdrawn yet
    let remainingAmount = amount;
    const earningsToReserve: any[] = [];

    for (const earning of withdrawableEarnings) {
      if (remainingAmount <= 0) break;

      // Skip if already linked to a pending transaction
      if (earning.withdrawalTransactionId) {
        const tx = await Transaction.findById(earning.withdrawalTransactionId).session(session);
        if (tx && (tx.status === "pending" || tx.status === "processing")) {
          continue;
        }
      }

      if (earning.amount <= remainingAmount) {
        // Reserve entire earning
        remainingAmount -= earning.amount;
        earningsToReserve.push({ earning, amount: earning.amount });
      } else {
        // Partial withdrawal - create a new earning record for the remaining amount
        const reservedAmount = remainingAmount;
        const remainingEarningAmount = earning.amount - reservedAmount;

        // Create new earning for remaining amount
        const newEarning = await Earning.create(
          [
            {
              userId: earning.userId,
              investmentId: earning.investmentId,
              type: earning.type,
              amount: remainingEarningAmount,
              date: earning.date,
              withdrawableDate: earning.withdrawableDate,
              isWithdrawn: false,
              referredUserId: earning.referredUserId,
              referralTier: earning.referralTier,
              referralPercentage: earning.referralPercentage,
            },
          ],
          { session }
        );

        // Update current earning to be reserved
        earningsToReserve.push({ earning, amount: reservedAmount });
        remainingAmount = 0;
      }
    }

    // Create withdrawal transaction (pending - will be processed by admin)
    const reference = `earn_with_${uuid()}`;
    const tx = await Transaction.create(
      [
        {
          userId,
          type: "withdrawal",
          amount,
          currency: currency.toUpperCase(),
          address: walletAddress,
          reference,
          status: "pending", // Admin will process this manually
        },
      ],
      { session }
    );

    const transactionId = String(tx[0]._id);

    // Link earnings to withdrawal transaction (but don't mark as withdrawn yet)
    // Admin will mark them as withdrawn when processing the withdrawal
    for (const { earning, amount: reservedAmount } of earningsToReserve) {
      if (earning.amount === reservedAmount) {
        // Full earning reserved
        earning.withdrawalTransactionId = tx[0]._id;
        await earning.save({ session });
      } else {
        // Partial earning - update the amount and link it
        earning.amount = reservedAmount;
        earning.withdrawalTransactionId = tx[0]._id;
        await earning.save({ session });
      }
    }

    await session.commitTransaction();
    return {
      reference,
      transactionId,
      message: "Withdrawal request created successfully. It will be processed by admin manually.",
    };
  } catch (err: any) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}


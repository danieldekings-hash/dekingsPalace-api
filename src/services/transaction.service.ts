import { Transaction, ITransaction } from "../models/Transaction.model";
import { Earning } from "../models/Earning.model";
import mongoose from "mongoose";

type ListFilters = {
  userId: string;
  type?: ITransaction["type"] | "investment" | "referral" | "bonus";
  status?: ITransaction["status"] | "processing" | "completed";
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
};

export async function listTransactions({ userId, type, status, startDate, endDate, page, limit }: ListFilters) {
  const query: any = { userId };
  if (type) query.type = type;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {} as any;
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(query),
  ]);

  // Enhance response with wallet-focused labeling without changing stored enums
  const enhanced = items.map((t) => {
    const isInvestmentDebit = t.type === "withdrawal" && typeof t.reference === "string" && t.reference.startsWith("inv_");
    const displayType =
      t.type === "deposit"
        ? "wallet_deposit"
        : isInvestmentDebit
        ? "wallet_debit"
        : t.type === "withdrawal"
        ? "wallet_withdrawal"
        : t.type;
    return { ...t, displayType };
  });

  return {
    category: "wallet",
    title: "Wallet Transactions",
    transactions: enhanced,
    total,
    page,
    limit,
  };
}

export async function listAllWithdrawals({
  status,
  page = 1,
  limit = 20,
}: { status?: ITransaction["status"]; page?: number; limit?: number }) {
  const query: any = { type: "withdrawal" };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  // Map to admin view (includes wallet address as 'address')
  const results = items.map((t) => ({
    id: String(t._id),
    userId: String(t.userId),
    amount: t.amount,
    currency: t.currency,
    status: t.status,
    address: t.address || null,
    reference: t.reference,
    txHash: t.txHash || null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return { data: results, meta: { total, page, limit } };
}


export async function confirmWithdrawalTransaction(
  id: string,
  { txHash }: { txHash?: string } = {}
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findById(id).session(session);
    if (!tx) throw new Error("Transaction not found");
    if (tx.type !== "withdrawal") throw new Error("Not a withdrawal transaction");
    if (!(tx.status === "pending" || tx.status === "processing")) {
      throw new Error("Only pending/processing withdrawals can be confirmed");
    }

    // Mark linked earnings as withdrawn
    await Earning.updateMany(
      { withdrawalTransactionId: tx._id, isWithdrawn: false },
      { $set: { isWithdrawn: true } },
      { session }
    );

    tx.status = "confirmed";
    if (txHash) tx.txHash = txHash;
    await tx.save({ session });

    await session.commitTransaction();
    return { id: String(tx._id), status: tx.status };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function failWithdrawalTransaction(
  id: string,
  _data: { reason?: string } = {}
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findById(id).session(session);
    if (!tx) throw new Error("Transaction not found");
    if (tx.type !== "withdrawal") throw new Error("Not a withdrawal transaction");
    if (!(tx.status === "pending" || tx.status === "processing")) {
      throw new Error("Only pending/processing withdrawals can be failed");
    }

    // Release linked earnings reservation
    await Earning.updateMany(
      { withdrawalTransactionId: tx._id, isWithdrawn: false },
      { $set: { withdrawalTransactionId: null } },
      { session }
    );

    tx.status = "failed";
    await tx.save({ session });

    await session.commitTransaction();
    return { id: String(tx._id), status: tx.status };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function getTransactionById(userId: string, id: string) {
  const tx = await Transaction.findOne({ _id: id, userId }).lean();
  return tx;
}

export async function exportTransactionsCSV(filters: Omit<ListFilters, "page" | "limit">) {
  const { userId, type, status, startDate, endDate } = filters;
  const query: any = { userId };
  if (type) query.type = type;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {} as any;
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  const items = await Transaction.find(query).sort({ createdAt: -1 }).lean();
  const header = ["date","type","status","amount","currency","reference","address","txHash"].join(",");
  const lines = items.map((t) => [
    new Date(t.createdAt).toISOString(),
    t.type,
    t.status,
    t.amount,
    t.currency,
    t.reference,
    t.address || "",
    t.txHash || "",
  ].join(","));
  const csv = [header, ...lines].join("\n");
  return csv;
}



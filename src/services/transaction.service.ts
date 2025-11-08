import { Transaction, ITransaction } from "../models/Transaction.model";

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

  return { transactions: items, total, page, limit };
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



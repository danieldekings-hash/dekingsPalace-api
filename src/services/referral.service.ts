import { Referral } from "../models/Referral.model";
import { Transaction } from "../models/Transaction.model";

export async function getReferralSummary(userId: string, baseUrl?: string) {
  const userRef = await Referral.find({ referrerId: userId });
  const totalSignups = userRef.length;
  const totalEarningsAgg = await Transaction.aggregate([
    { $match: { userId: (Referral as any).db.base.Types.ObjectId.createFromHexString(userId), type: "referral" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalEarnings = totalEarningsAgg[0]?.total || 0;
  const referralCodeDoc = await Referral.findOne({ referrerId: userId }).lean();
  const referralCode = referralCodeDoc?.referralCode;
  const referralUrl = referralCode ? `${baseUrl || "https://dekingspalace.com"}/register?ref=${referralCode}` : undefined;
  return { referralCode, referralUrl, totalSignups, totalEarnings };
}

export async function listReferredUsers(userId: string, page = 1, limit = 10, status?: string) {
  const query: any = { referrerId: userId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const [referrals, total] = await Promise.all([
    Referral.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("referredId", "fullName email role").lean(),
    Referral.countDocuments(query),
  ]);
  return { referrals, total };
}

export async function listReferralEarnings(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Transaction.find({ userId, type: "referral" }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments({ userId, type: "referral" }),
  ]);
  return { earnings: items, total };
}



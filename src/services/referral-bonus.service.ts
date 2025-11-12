import { User } from "../models/User.model";
import { Investment } from "../models/Investment.model";
import { Referral } from "../models/Referral.model";
import { Earning } from "../models/Earning.model";
import { Wallet } from "../models/Wallet.model";
import { Transaction } from "../models/Transaction.model";
import { InvestmentPlan, getPlanConfig } from "../constants/investment.plans";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

/**
 * Determines the user's tier based on their highest investment plan
 * @param userId - The user's ID
 * @returns The tier name (Bronze, Silver, Gold, Platinum, Diamond) or null
 */
export async function getUserTier(userId: string): Promise<string | null> {
  const investments = await Investment.find({ userId, status: "active" })
    .sort({ amount: -1 })
    .limit(1)
    .lean();

  if (investments.length === 0) {
    return null;
  }

  const highestInvestment = investments[0];
  const planConfig = getPlanConfig(highestInvestment.plan);
  if (!planConfig) {
    return null;
  }

  // Extract tier from plan name (e.g., "Gold Plan" -> "Gold")
  return planConfig.name.split(" ")[0];
}

/**
 * Determines the referral bonus percentage based on referrer's tier
 * GOLD and below: 3%
 * DIAMOND and above (Platinum, Diamond): 5%
 * @param tier - The referrer's tier
 * @returns The referral bonus percentage
 */
export function getReferralBonusPercentage(tier: string | null): number {
  if (!tier) {
    return 0; // No tier = no bonus
  }

  const tierUpper = tier.toUpperCase();
  
  // DIAMOND and above (Platinum, Diamond) get 5%
  if (tierUpper === "PLATINUM" || tierUpper === "DIAMOND") {
    return 5;
  }
  
  // GOLD and below (Bronze, Silver, Gold) get 3%
  if (tierUpper === "BRONZE" || tierUpper === "SILVER" || tierUpper === "GOLD") {
    return 3;
  }

  return 0;
}

/**
 * Awards referral bonus when a user makes an investment
 * @param referredUserId - The user who made the investment
 * @param investmentId - The investment ID
 * @param investmentAmount - The investment amount
 * @param investmentPlan - The investment plan name
 * @param session - MongoDB session for transaction
 */
export async function awardReferralBonus(
  referredUserId: string,
  investmentId: string,
  investmentAmount: number,
  investmentPlan: string,
  session: mongoose.ClientSession
): Promise<void> {
  try {
    // Find the referral relationship
    const referral = await Referral.findOne({ referredId: referredUserId }).session(session);
    
    if (!referral) {
      // No referrer, no bonus
      return;
    }

    // Idempotency: if a referral bonus was already created for this referred user, skip
    const existingBonus = await Earning.exists({
      type: "referral_bonus",
      referredUserId: new mongoose.Types.ObjectId(referredUserId),
    }).session(session);
    if (existingBonus) {
      return;
    }

    // Award only on the referred user's first investment
    // Since this runs right after creating an investment, the first-investment case
    // is when the total count of investments for the user is exactly 1
    const investmentCount = await Investment.countDocuments({ userId: referredUserId }).session(session);
    if (investmentCount !== 1) {
      return;
    }

    const referrerId = String(referral.referrerId);

    // Get the referrer's tier
    const referrerTier = await getUserTier(referrerId);
    
    if (!referrerTier) {
      // Referrer has no active investments, no bonus
      return;
    }

    // Calculate bonus percentage
    const bonusPercentage = getReferralBonusPercentage(referrerTier);
    
    if (bonusPercentage === 0) {
      return;
    }

    // Calculate bonus amount
    const bonusAmount = (investmentAmount * bonusPercentage) / 100;

    // Calculate withdrawable date (1 month from now)
    const earningDate = new Date();
    const withdrawableDate = new Date(earningDate);
    withdrawableDate.setMonth(withdrawableDate.getMonth() + 1);

    // Create earning record for referral bonus
    await Earning.create(
      [
        {
          userId: new mongoose.Types.ObjectId(referrerId),
          type: "referral_bonus",
          amount: bonusAmount,
          date: earningDate,
          withdrawableDate,
          isWithdrawn: false,
          referredUserId: new mongoose.Types.ObjectId(referredUserId),
          referralTier: referrerTier,
          referralPercentage: bonusPercentage,
        },
      ],
      { session }
    );

    // Update referrer's wallet balance (add to USDT balance)
    const referrerWallet = await Wallet.findOne({ userId: referrerId }).session(session);
    if (referrerWallet) {
      referrerWallet.balances.USDT += bonusAmount;
      await referrerWallet.save({ session });
    } else {
      // Create wallet if it doesn't exist
      await Wallet.create(
        [
          {
            userId: referrerId,
            balances: { BTC: 0, ETH: 0, USDT: bonusAmount },
            totalDeposited: { BTC: 0, ETH: 0, USDT: 0 },
            totalWithdrawn: { BTC: 0, ETH: 0, USDT: 0 },
          },
        ],
        { session }
      );
    }

    // Create transaction record for the referral bonus
    const reference = `ref_bonus_${uuid()}`;
    await Transaction.create(
      [
        {
          userId: referrerId,
          type: "referral",
          amount: bonusAmount,
          currency: "USDT",
          reference,
          status: "confirmed",
          txHash: `referral_bonus_${reference}`,
          confirmations: 1,
        },
      ],
      { session }
    );

    // Update referral total earnings
    referral.totalEarnings += bonusAmount;
    referral.lastEarningDate = earningDate;
    await referral.save({ session });
  } catch (error) {
    console.error("Error awarding referral bonus:", error);
    // Don't throw - referral bonus failure shouldn't break investment creation
  }
}


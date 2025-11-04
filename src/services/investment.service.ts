import { Investment } from "../models/Investment.model";
import { Transaction } from "../models/Transaction.model";
import { Plan } from "../models/Plan.model";
import { v4 as uuid } from "uuid";
import { CreateInvestmentDTO, InvestmentResponse } from "../types";

export const createInvestment = async ({
  userId,
  planId,
  amount,
  currency,
}: CreateInvestmentDTO): Promise<InvestmentResponse> => {
  const reference = `inv_${uuid()}`;

  // Validate plan exists and is active
  const plan = await Plan.findById(planId).lean();
  if (!plan || !plan.isActive) {
    throw { status: 400, code: "INVALID_PLAN", message: "Investment plan is invalid or inactive" };
  }

  // Validate amount within min/max
  const withinMin = amount >= plan.minAmount;
  const withinMax = plan.maxAmount === 0 || amount <= plan.maxAmount;
  if (!withinMin || !withinMax) {
    throw {
      status: 400,
      code: "VALIDATION_ERROR",
      message: `Amount must be between ${plan.minAmount} and ${plan.maxAmount || "unlimited"}`,
    };
  }

  const investment = await Investment.create({ userId, plan: plan.name, amount, status: "pending" });
  const investmentId = String(investment._id);

  const transaction = await Transaction.create({
    userId,
    type: "deposit",
    amount,
    currency,
    address: process.env.PUBLIC_WALLET!,
    reference,
    status: "waiting_payment",
  });

  return {
    investmentId,
    reference,
    depositAddress: transaction.address || "",
    message: "Send funds to complete investment",
  };
};

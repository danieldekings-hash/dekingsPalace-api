import { Investment } from "../models/Investment.model";
import { Transaction } from "../models/Transaction.model";
import { v4 as uuid } from "uuid";
import { CreateInvestmentDTO, InvestmentResponse } from "../types";

export const createInvestment = async ({
  userId,
  plan,
  amount,
  currency,
}: CreateInvestmentDTO): Promise<InvestmentResponse> => {
  const reference = `inv_${uuid()}`;
  const investment = await Investment.create({ userId, plan, amount, status: "pending" });
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

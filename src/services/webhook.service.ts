import { Transaction } from "../models/Transaction.model";
import { Investment } from "../models/Investment.model";

interface WebhookPayload {
  reference: string;
  txHash: string;
  confirmations: number;
  status: "confirmed" | "failed";
}

export const processPaymentWebhook = async (payload: WebhookPayload) => {
  const { reference, txHash, confirmations, status } = payload;

  // Find the transaction by reference
  const transaction = await Transaction.findOne({ reference });

  if (!transaction) {
    return { success: false, message: "Transaction not found" };
  }

  // Update transaction details
  transaction.txHash = txHash;
  transaction.confirmations = confirmations;
  transaction.status = status === "confirmed" ? "confirmed" : "failed";
  await transaction.save();

  // If confirmed and it's a deposit, activate the investment
  if (status === "confirmed" && transaction.type === "deposit") {
    const investment = await Investment.findOne({
      userId: transaction.userId,
      amount: transaction.amount,
      status: "pending",
    }).sort({ createdAt: -1 });

    if (investment) {
      investment.status = "active";
      investment.startDate = new Date();
      // Set end date based on plan (example: 30 days)
      investment.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await investment.save();
    }
  }

  return {
    success: true,
    message: "Webhook processed successfully",
    transactionStatus: transaction.status,
  };
};

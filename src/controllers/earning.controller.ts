import { Request, Response } from "express";
import * as earningService from "../services/earning.service";
import { ok, fail } from "../utils/response";

/**
 * List all earnings for the authenticated user
 */
export async function listEarnings(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const query = {
      type: req.query.type as "investment_earning" | "referral_bonus" | "all" | undefined,
      isWithdrawn: req.query.isWithdrawn === "true" ? true : req.query.isWithdrawn === "false" ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
      sortBy: req.query.sortBy as "date" | "amount" | "withdrawableDate" | undefined,
      sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
    };

    const result = await earningService.listEarnings(userId, query);
    res.json(ok(result));
  } catch (error: any) {
    console.error("List earnings error:", error);
    res.status(500).json(fail("INTERNAL_ERROR", error.message || "Failed to list earnings"));
  }
}

/**
 * Get earnings summary for the authenticated user
 */
export async function getEarningsSummary(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const summary = await earningService.getEarningsSummary(userId);
    res.json(ok(summary));
  } catch (error: any) {
    console.error("Get earnings summary error:", error);
    res.status(500).json(fail("INTERNAL_ERROR", error.message || "Failed to get earnings summary"));
  }
}

/**
 * Withdraw available earnings
 */
export async function withdrawEarnings(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { amount, currency, walletAddress } = req.body;

    const result = await earningService.withdrawEarnings(userId, amount, currency, walletAddress);
    res.status(201).json(ok(result, "Withdrawal request created successfully"));
  } catch (error: any) {
    console.error("Withdraw earnings error:", error);

    if (error.code === "NO_WITHDRAWABLE_EARNINGS") {
      return res.status(400).json(fail("NO_WITHDRAWABLE_EARNINGS", error.message));
    }

    if (error.code === "INSUFFICIENT_EARNINGS") {
      return res.status(400).json(fail("INSUFFICIENT_EARNINGS", error.message));
    }

    if (error.code === "WALLET_NOT_FOUND") {
      return res.status(404).json(fail("WALLET_NOT_FOUND", error.message));
    }

    if (error.code === "INSUFFICIENT_BALANCE") {
      return res.status(400).json(fail("INSUFFICIENT_BALANCE", error.message));
    }

    res.status(500).json(fail("INTERNAL_ERROR", error.message || "Failed to withdraw earnings"));
  }
}


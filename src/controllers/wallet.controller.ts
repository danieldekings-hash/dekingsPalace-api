import { Request, Response } from "express";
import * as walletService from "../services/wallet.service";

/**
 * Manually deposit funds into user's wallet (for testing)
 * Users can deposit into their own wallet, admins can deposit into any wallet
 */
export const createManualDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { userId, amount, currency, reference } = req.body;

    // Validate required fields
    if (!amount || !currency) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: amount and currency are required.",
      });
      return;
    }

    // Validate amount is a number
    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid amount. Amount must be a positive number.",
      });
      return;
    }

    // Determine target user ID
    let targetUserId: string;
    if (userRole === "admin" && userId) {
      // Admins can deposit into any user's wallet
      targetUserId = userId;
    } else {
      // Regular users can only deposit into their own wallet
      targetUserId = authenticatedUserId;
    }

    const result = await walletService.createManualDeposit({
      userId: targetUserId,
      amount,
      currency,
      reference,
    });

    res.status(result.status || 200).json(result);
  } catch (error: any) {
    console.error("Manual deposit controller error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * Get user wallet balance
 * Users can only check their own balance, admins can check any user's balance
 */
export const getWalletBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const queryUserId = req.query.userId as string;

    // Determine target user ID
    let targetUserId: string;
    if (userRole === "admin" && queryUserId) {
      // Admins can check any user's balance
      targetUserId = queryUserId;
    } else {
      // Regular users can only check their own balance
      targetUserId = authenticatedUserId;
    }

    const result = await walletService.getWalletBalance(targetUserId);
    res.status(result.status || 200).json(result);
  } catch (error: any) {
    console.error("Get wallet balance controller error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


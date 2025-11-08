import { Request, Response } from "express";
import * as investmentService from "../services/investment.service";
import { InvestmentError } from "../types";

/**
 * Create a new investment
 * Deducts the investment amount from user's wallet balance
 */
export const createInvestment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { plan, amount, currency } = req.body;

    // Validate required fields
    if (!plan || !amount || !currency) {
      res.status(400).json({
        status: 400,
        message: "Missing required fields: plan, amount, and currency are required.",
      });
      return;
    }

    // Validate amount is a number
    if (typeof amount !== "number" || isNaN(amount)) {
      res.status(400).json({
        status: 400,
        message: "Invalid amount. Amount must be a valid number.",
      });
      return;
    }

    const result = await investmentService.createInvestment({
      userId,
      plan,
      amount,
      currency,
    });

    // Check if result is an error (InvestmentError has status and message, InvestmentResponse has investmentId)
    if ("status" in result && !("investmentId" in result)) {
      const error = result as InvestmentError;
      res.status(error.status).json({
        status: error.status,
        message: error.message,
      });
      return;
    }

    // Success response
    res.status(201).json({
      status: 201,
      message: "Investment created successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Investment controller error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Internal server error",
    });
  }
};

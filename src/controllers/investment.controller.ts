import { Request, Response } from "express";
import * as investmentService from "../services/investment.service";
import { InvestmentError } from "../types";

/**
 * Create a new investment
 * Deducts the investment amount from user's wallet balance
 */
export const createInvestment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plan, amount, currency } = req.body;

    const result = await investmentService.createInvestment({ userId, plan, amount, currency });

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

export const listInvestments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await investmentService.listInvestments(userId, req.query as any);
    res.json({ data: result.data, meta: result.meta });
  } catch (error: any) {
    res.status(500).json({ status: 500, message: error.message || "Internal server error" });
  }
};

export const getInvestmentsSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const data = await investmentService.getInvestmentsSummary(userId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ status: 500, message: error.message || "Internal server error" });
  }
};

export const getInvestment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const data = await investmentService.getInvestmentById(userId, id);
    if (!data) return res.status(404).json({ status: 404, message: "Not found" });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ status: 500, message: error.message || "Internal server error" });
  }
};

export const patchInvestment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { action } = req.body as { action: "pause" | "resume" };
    const data = await investmentService.patchInvestment(userId, id, action);
    if ("status" in (data as any)) {
      const err = data as InvestmentError;
      return res.status(err.status).json(err);
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ status: 500, message: error.message || "Internal server error" });
  }
};

export const exportInvestments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { format = "csv" } = req.query as any;
    const { buffer, mime, filename } = await investmentService.exportInvestments(userId, req.query as any);
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ status: 500, message: error.message || "Internal server error" });
  }
};
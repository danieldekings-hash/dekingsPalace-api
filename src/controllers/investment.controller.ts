import { Request, Response } from "express";
import * as investmentService from "../services/investment.service";

export const createInvestment = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { plan, amount, currency } = req.body;
  const result = await investmentService.createInvestment({ userId, plan, amount, currency });
  res.status(201).json(result);
};

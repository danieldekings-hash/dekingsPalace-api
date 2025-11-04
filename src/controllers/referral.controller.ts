import { Request, Response } from "express";
import * as service from "../services/referral.service";
import { ok } from "../utils/response";

export async function getInfo(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const baseUrl = process.env.APP_BASE_URL;
  const info = await service.getReferralSummary(userId, baseUrl);
  res.json(ok(info));
}

export async function list(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { page = 1, limit = 10, status } = req.query as any;
  const result = await service.listReferredUsers(userId, Number(page), Number(limit), status);
  res.json(ok(result));
}

export async function earnings(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { page = 1, limit = 20 } = req.query as any;
  const result = await service.listReferralEarnings(userId, Number(page), Number(limit));
  res.json(ok(result));
}



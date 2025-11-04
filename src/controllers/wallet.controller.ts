import { Request, Response } from "express";
import * as walletService from "../services/wallet.service";
import { ok, fail } from "../utils/response";

export async function getWallet(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const wallet = await walletService.getWallet(userId);
  res.json(ok(wallet));
}

export async function getAddresses(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const addresses = await walletService.getOrGenerateAddresses(userId);
  res.json(ok({ addresses }));
}

export async function deposit(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { amount, currency, transactionHash } = req.body;
  const result = await walletService.createDeposit(userId, amount, currency, transactionHash);
  res.status(201).json(ok(result, "Deposit created"));
}

export async function withdraw(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { amount, currency, walletAddress } = req.body;
  try {
    const result = await walletService.createWithdrawal(userId, amount, currency, walletAddress);
    res.status(201).json(ok(result, "Withdrawal requested"));
  } catch (err: any) {
    if (err?.code === "INSUFFICIENT_BALANCE") {
      return res.status(400).json(fail("INSUFFICIENT_BALANCE", "Insufficient balance"));
    }
    throw err;
  }
}



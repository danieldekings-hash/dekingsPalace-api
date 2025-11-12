import { Request, Response } from "express";
import * as service from "../services/transaction.service";
import { ok, fail } from "../utils/response";

export async function list(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { type, status, startDate, endDate, page, limit } = req.query as any;
  const result = await service.listTransactions({
    userId,
    type,
    status,
    startDate,
    endDate,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });
  res.json(ok(result));
}

export async function get(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const tx = await service.getTransactionById(userId, id);
  if (!tx) return res.status(404).json(fail("NOT_FOUND", "Transaction not found"));
  res.json(ok(tx));
}

export async function exportCSV(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { type, status, startDate, endDate } = req.query as any;
  const csv = await service.exportTransactionsCSV({ userId, type, status, startDate, endDate } as any);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
  res.send(csv);
}

export async function confirmWithdrawal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { txHash } = req.body as { txHash?: string };
    const result = await service.confirmWithdrawalTransaction(id, { txHash });
    res.json(ok(result, "Withdrawal confirmed"));
  } catch (error: any) {
    res.status(400).json(fail("WITHDRAWAL_CONFIRM_ERROR", error.message || "Failed to confirm withdrawal"));
  }
}

export async function failWithdrawal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await service.failWithdrawalTransaction(id, req.body as any);
    res.json(ok(result, "Withdrawal failed and earnings released"));
  } catch (error: any) {
    res.status(400).json(fail("WITHDRAWAL_FAIL_ERROR", error.message || "Failed to fail withdrawal"));
  }
}

export async function adminListWithdrawals(req: Request, res: Response) {
  try {
    const { status, page, limit } = req.query as any;
    const result = await service.listAllWithdrawals({ status, page: Number(page) || 1, limit: Number(limit) || 20 });
    res.json(ok(result));
  } catch (error: any) {
    res.status(500).json(fail("INTERNAL_ERROR", error.message || "Failed to list withdrawals"));
  }
}



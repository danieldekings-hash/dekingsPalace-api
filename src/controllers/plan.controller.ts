import { Request, Response } from "express";
import * as planService from "../services/plan.service";
import { ok, fail } from "../utils/response";

export async function list(req: Request, res: Response) {
  const plans = await planService.listActivePlans();
  res.json(ok(plans));
}

export async function get(req: Request, res: Response) {
  const { id } = req.params;
  const plan = await planService.getPlanById(id);
  if (!plan) return res.status(404).json(fail("NOT_FOUND", "Plan not found"));
  res.json(ok(plan));
}

export async function create(req: Request, res: Response) {
  const plan = await planService.createPlan(req.body);
  res.status(201).json(ok(plan, "Plan created"));
}

export async function update(req: Request, res: Response) {
  const { id } = req.params;
  const plan = await planService.updatePlan(id, req.body);
  if (!plan) return res.status(404).json(fail("NOT_FOUND", "Plan not found"));
  res.json(ok(plan, "Plan updated"));
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params;
  await planService.deletePlan(id);
  res.json(ok(undefined, "Plan deactivated"));
}



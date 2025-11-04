import { Plan, IPlan } from "../models/Plan.model";

export async function listActivePlans(): Promise<IPlan[]> {
  return Plan.find({ isActive: true }).sort({ minAmount: 1 });
}

export async function getPlanById(id: string): Promise<IPlan | null> {
  return Plan.findById(id);
}

export async function createPlan(payload: Partial<IPlan>): Promise<IPlan> {
  const plan = await Plan.create(payload);
  return plan;
}

export async function updatePlan(id: string, payload: Partial<IPlan>): Promise<IPlan | null> {
  return Plan.findByIdAndUpdate(id, payload, { new: true });
}

export async function deletePlan(id: string): Promise<void> {
  await Plan.findByIdAndUpdate(id, { isActive: false });
}



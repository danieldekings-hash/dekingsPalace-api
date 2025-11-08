/**
 * Investment Plan Constants
 * Defines the different investment plans with their amount ranges and monthly return percentages
 * Returns are calculated on a monthly basis
 */

export enum InvestmentPlan {
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum",
  DIAMOND = "diamond",
}

export interface InvestmentPlanConfig {
  plan: InvestmentPlan;
  minAmount: number;
  maxAmount: number;
  returnPercentage: number; // Monthly return percentage
  name: string;
}

export const INVESTMENT_PLANS: InvestmentPlanConfig[] = [
  {
    plan: InvestmentPlan.BRONZE,
    minAmount: 20,
    maxAmount: 50,
    returnPercentage: 5,
    name: "Bronze Plan",
  },
  {
    plan: InvestmentPlan.SILVER,
    minAmount: 51,
    maxAmount: 100,
    returnPercentage: 8,
    name: "Silver Plan",
  },
  {
    plan: InvestmentPlan.GOLD,
    minAmount: 101,
    maxAmount: 500,
    returnPercentage: 10,
    name: "Gold Plan",
  },
  {
    plan: InvestmentPlan.PLATINUM,
    minAmount: 501,
    maxAmount: 5000,
    returnPercentage: 15,
    name: "Platinum Plan",
  },
  {
    plan: InvestmentPlan.DIAMOND,
    minAmount: 5001,
    maxAmount: Infinity,
    returnPercentage: 20,
    name: "Diamond Plan",
  },
];

/**
 * Validates if an amount matches a specific investment plan
 * @param plan - The investment plan
 * @param amount - The investment amount
 * @returns boolean - true if amount is within plan range
 */
export const validateInvestmentPlan = (plan: string, amount: number): boolean => {
  const planConfig = INVESTMENT_PLANS.find((p) => p.plan === plan.toLowerCase());
  if (!planConfig) return false;
  return amount >= planConfig.minAmount && amount <= planConfig.maxAmount;
};

/**
 * Gets the investment plan configuration for a given amount
 * @param amount - The investment amount
 * @returns InvestmentPlanConfig | null - The matching plan or null if no plan matches
 */
export const getPlanByAmount = (amount: number): InvestmentPlanConfig | null => {
  return (
    INVESTMENT_PLANS.find(
      (plan) => amount >= plan.minAmount && amount <= plan.maxAmount
    ) || null
  );
};

/**
 * Gets the investment plan configuration by plan name
 * @param plan - The investment plan name
 * @returns InvestmentPlanConfig | null - The plan configuration or null if not found
 */
export const getPlanConfig = (plan: string): InvestmentPlanConfig | null => {
  return (
    INVESTMENT_PLANS.find((p) => p.plan === plan.toLowerCase()) || null
  );
};

/**
 * Calculates the monthly return for an investment
 * @param amount - The investment amount
 * @param plan - The investment plan
 * @returns number - The monthly return amount (earned each month)
 */
export const calculateInvestmentReturn = (amount: number, plan: string): number => {
  const planConfig = getPlanConfig(plan);
  if (!planConfig) return 0;
  // Calculate monthly return based on monthly percentage
  return (amount * planConfig.returnPercentage) / 100;
};


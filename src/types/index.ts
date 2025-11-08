import { Schema } from "mongoose";
import { InvestmentPlan } from "../constants/investment.plans";

export interface CreateInvestmentDTO {
  userId: Schema.Types.ObjectId | string;
  plan: InvestmentPlan | string;
  amount: number;
  currency: string;
}

export interface RegisterUserDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
  role?: "investor" | "admin";
}

export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface VerifyEmailDTO {
  email: string;
  otp: string;
}

export interface ResendOTPDTO {
  email: string;
}

export interface AuthResponse {
  status: number;
  message: string;
  token?: string;
  referralCode?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
    referralCode: string;
    referredBy?: string;
    walletBalance?: number;
    isVerified?: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface InvestmentResponse {
  investmentId: string;
  reference: string;
  message: string;
  plan: string;
  amount: number;
  expectedReturn: number; // Monthly return amount
  returnPercentage: number; // Monthly return percentage
  startDate: Date;
  endDate: Date;
  walletBalance: number;
}

export interface InvestmentError {
  status: number;
  message: string;
}

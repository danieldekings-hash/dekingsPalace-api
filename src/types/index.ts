import { Schema } from "mongoose";

export interface CreateInvestmentDTO {
  userId: Schema.Types.ObjectId | string;
  plan: string;
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
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface InvestmentResponse {
  investmentId: string;
  reference: string;
  depositAddress: string;
  message: string;
}

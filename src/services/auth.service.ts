import { User } from "../models/User.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { RegisterUserDTO, LoginUserDTO, AuthResponse } from "../types";
import { v4 as uuid } from "uuid";
import { Types } from "mongoose";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { PasswordResetToken } from "../models/PasswordResetToken.model";
import { Referral } from "../models/Referral.model";

export const registerUser = async (data: RegisterUserDTO): Promise<AuthResponse> => {
  // Validate password match
  if (data.password !== data.confirmPassword) {
    return { status: 400, message: "Passwords do not match" };
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email: data.email });
  if (existingEmail) return { status: 400, message: "Email already registered" };

  // Check if phone number already exists
  const existingPhone = await User.findOne({ phoneNumber: data.phoneNumber });
  if (existingPhone) return { status: 400, message: "Phone number already registered" };

  // Validate referral code if provided
  let referredBy: string | undefined;
  if (data.referralCode) {
    const referrer = await User.findOne({ referralCode: data.referralCode });
    if (!referrer) {
      return { status: 400, message: "Invalid referral code" };
    }
    referredBy = referrer.referralCode;
  }

  // Generate unique referral code for new user
  const newReferralCode = uuid().substring(0, 8).toUpperCase();

  // Create user
  const user = await User.create({
    fullName: data.fullName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    password: data.password,
    role: data.role || "investor",
    referralCode: newReferralCode,
    referredBy,
  });

  // Create referral record if referred
  if (data.referralCode) {
    const referrer = await User.findOne({ referralCode: data.referralCode });
    if (referrer) {
      await Referral.create({
        referrerId: referrer._id,
        referredId: user._id,
        referralCode: data.referralCode,
        level: 1,
        status: "active",
        currency: "USDT",
      });
    }
  }

  const accessToken = signAccessToken({ id: String(user._id), role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ id: String(user._id), role: user.role, email: user.email });

  return { 
    status: 201, 
    message: "User registered successfully", 
    token: accessToken,
    refreshToken,
    referralCode: newReferralCode,
    user: {
      id: (user._id as Types.ObjectId).toString(),
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  };
};

export const loginUser = async (data: LoginUserDTO): Promise<AuthResponse> => {
  const user = await User.findOne({ email: data.email });
  if (!user) return { status: 404, message: "User not found" };

  const match = await bcrypt.compare(data.password, user.password);
  if (!match) return { status: 401, message: "Invalid credentials" };

  const accessToken = signAccessToken({ id: String(user._id), role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ id: String(user._id), role: user.role, email: user.email });
  return { 
    status: 200, 
    message: "Login successful", 
    token: accessToken,
    refreshToken,
    user: {
      id: (user._id as Types.ObjectId).toString(),
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  };
};

export const refreshAuthToken = async (refreshToken: string | undefined): Promise<AuthResponse> => {
  if (!refreshToken) return { status: 401, message: "Refresh token required" };
  try {
    const payload = verifyRefreshToken(refreshToken) as any;
    const user = await User.findById(payload.id);
    if (!user) return { status: 401, message: "Invalid refresh token" };
    const token = signAccessToken({ id: String(user._id), role: user.role, email: user.email });
    const newRefresh = signRefreshToken({ id: String(user._id), role: user.role, email: user.email });
    return { status: 200, message: "Token refreshed", token, refreshToken: newRefresh };
  } catch (e) {
    return { status: 401, message: "Invalid or expired refresh token" };
  }
};

export const logoutUser = async (): Promise<AuthResponse> => {
  return { status: 200, message: "Logged out successfully" };
};

export const requestPasswordReset = async (email: string): Promise<AuthResponse> => {
  const user = await User.findOne({ email });
  if (!user) return { status: 200, message: "If the email exists, a reset link will be sent" };
  const token = uuid().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await PasswordResetToken.create({ userId: user._id, token, expiresAt });
  // Email sending would happen here
  return { status: 200, message: "Password reset email sent" };
};

export const resetPassword = async (token: string, newPassword: string): Promise<AuthResponse> => {
  const entry = await PasswordResetToken.findOne({ token, used: false });
  if (!entry) return { status: 400, message: "Invalid or expired token" };
  if (entry.expiresAt.getTime() < Date.now()) return { status: 400, message: "Invalid or expired token" };
  const user = await User.findById(entry.userId);
  if (!user) return { status: 400, message: "Invalid token" };
  user.password = newPassword;
  await user.save();
  entry.used = true;
  await entry.save();
  return { status: 200, message: "Password reset successful" };
};

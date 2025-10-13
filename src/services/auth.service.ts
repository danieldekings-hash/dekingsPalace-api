import { User } from "../models/User.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { RegisterUserDTO, LoginUserDTO, AuthResponse } from "../types";
import { v4 as uuid } from "uuid";
import { Types } from "mongoose";

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

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "1d" });

  return { 
    status: 201, 
    message: "User registered successfully", 
    token,
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

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "1d" });
  return { 
    status: 200, 
    message: "Login successful", 
    token,
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

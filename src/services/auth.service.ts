import { User } from "../models/User.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { RegisterUserDTO, LoginUserDTO, AuthResponse, VerifyEmailDTO, ResendOTPDTO } from "../types";
import { v4 as uuid } from "uuid";
import { Types } from "mongoose";
import { generateOTP, sendOTPEmail } from "./email.service";

export const registerUser = async (data: RegisterUserDTO): Promise<AuthResponse> => {
  // Validate password match
  if (data.password !== data.confirmPassword) {
    return { status: 400, message: "Passwords do not match" };
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email: data.email });
  if (existingEmail) {
    if (existingEmail.isVerified) {
      return { status: 400, message: "Email already registered and verified" };
    }
    // If email exists but not verified, check if phone number conflicts
    if (existingEmail.phoneNumber !== data.phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber: data.phoneNumber });
      if (existingPhone && (existingPhone._id as Types.ObjectId).toString() !== (existingEmail._id as Types.ObjectId).toString()) {
        return { status: 400, message: "Phone number already registered to another account" };
      }
    }
    
    // Generate new OTP and update user information
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    
    // Update existing user with new information and OTP
    existingEmail.fullName = data.fullName;
    existingEmail.phoneNumber = data.phoneNumber;
    existingEmail.password = data.password; // Will be hashed by pre-save hook
    existingEmail.otp = otp;
    existingEmail.otpExpiry = otpExpiry;
    
    // Update referral code if provided
    if (data.referralCode) {
      const referrer = await User.findOne({ referralCode: data.referralCode });
      if (referrer) {
        existingEmail.referredBy = referrer.referralCode;
      }
    }
    
    await existingEmail.save();
    
    // Send OTP via email
    const emailSent = await sendOTPEmail(existingEmail.email, otp, existingEmail.fullName);
    
    if (!emailSent) {
      return { status: 500, message: "Failed to send verification email. Please try again." };
    }
    
    return { 
      status: 200, 
      message: "Verification code has been sent to your email. Please verify your email to complete registration.",
      referralCode: existingEmail.referralCode,
    };
  }

  // Check if phone number already exists (for new registrations)
  const existingPhone = await User.findOne({ phoneNumber: data.phoneNumber });
  if (existingPhone) {
    return { status: 400, message: "Phone number already registered" };
  }

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

  // Generate OTP (6 digits)
  const otp = generateOTP();
  
  // Set expiry time (5 minutes)
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  // Create user (unverified)
  const user = await User.create({
    fullName: data.fullName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    password: data.password,
    role: data.role || "investor",
    referralCode: newReferralCode,
    referredBy,
    otp,
    otpExpiry,
    isVerified: false,
  });

  // Send OTP via email
  const emailSent = await sendOTPEmail(user.email, otp, user.fullName);
  
  if (!emailSent) {
    // If email fails to send, delete the user and return error
    await User.findByIdAndDelete(user._id);
    return { status: 500, message: "Failed to send verification email. Please try again." };
  }

  return { 
    status: 201, 
    message: "Registration successful. Please check your email for the verification code.",
    referralCode: newReferralCode,
  };
};

/**
 * Verify user email with OTP
 * @param data - Email and OTP
 * @returns AuthResponse
 */
export const verifyEmail = async (data: VerifyEmailDTO): Promise<AuthResponse> => {
  const user = await User.findOne({ email: data.email });
  if (!user) return { status: 404, message: "User not found" };

  const match = await bcrypt.compare(data.password, user.password);
  if (!match) return { status: 401, message: "Invalid credentials" };

  // Check if email is verified
  if (!user.isVerified) {
    return { 
      status: 403, 
      message: "Please verify your email before logging in. Check your email for the verification code." 
    };
  }

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
      walletBalance: user.walletBalance || 0,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  };
};

/**
 * Verify user email with OTP
 * @param data - Email and OTP
 * @returns AuthResponse
 */
export const verifyEmail = async (data: VerifyEmailDTO): Promise<AuthResponse> => {
  const user = await User.findOne({ email: data.email });
  if (!user) {
    return { status: 404, message: "User not found" };
  }

  if (user.isVerified) {
    return { status: 400, message: "Email already verified" };
  }

  if (!user.otp || !user.otpExpiry) {
    return { status: 400, message: "No OTP found. Please request a new OTP." };
  }

  if (user.otp !== data.otp) {
    return { status: 400, message: "Invalid OTP" };
  }

  if (user.otpExpiry < new Date()) {
    return { status: 400, message: "OTP expired. Please request a new OTP." };
  }

  // Mark as verified and clear OTP
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  // Generate token after successful verification
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "1d" });

  return {
    status: 200,
    message: "Email verified successfully",
    token,
    user: {
      id: (user._id as Types.ObjectId).toString(),
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      walletBalance: user.walletBalance || 0,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  };
};

/**
 * Resend OTP to user's email
 * @param data - Email
 * @returns AuthResponse
 */
export const resendOTP = async (data: ResendOTPDTO): Promise<AuthResponse> => {
  const user = await User.findOne({ email: data.email });
  if (!user) {
    return { status: 404, message: "User not found" };
  }

  if (user.isVerified) {
    return { status: 400, message: "Email already verified" };
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Update user with new OTP
  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  // Send OTP via email
  const emailSent = await sendOTPEmail(user.email, otp, user.fullName);
  
  if (!emailSent) {
    return { status: 500, message: "Failed to send verification email. Please try again." };
  }

  return {
    status: 200,
    message: "Verification code has been sent to your email",
  };
};

import { User } from "../models/User.model";
import { PasswordResetToken } from "../models/PasswordResetToken.model";
import bcrypt from "bcrypt";
import { RegisterUserDTO, LoginUserDTO, AuthResponse, VerifyEmailDTO, ResendOTPDTO } from "../types";
import { v4 as uuid } from "uuid";
import { Types } from "mongoose";
import { generateOTP, sendOTPEmail } from "./email.service";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { Resend } from "resend";

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
 * Login user with email and password
 * @param data - Email and password
 * @returns AuthResponse
 */
export const loginUser = async (data: LoginUserDTO): Promise<AuthResponse> => {
  const user = await User.findOne({ email: data.email });
  if (!user) {
    return { status: 401, message: "Invalid email or password" };
  }

  const match = await bcrypt.compare(data.password, user.password);
  if (!match) {
    return { status: 401, message: "Invalid email or password" };
  }

  // Check if email is verified
  if (!user.isVerified) {
    return { 
      status: 403, 
      message: "Please verify your email before logging in. Check your email for the verification code." 
    };
  }

  // Generate tokens
  const token = signAccessToken({ id: String(user._id), role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ id: String(user._id), role: user.role, email: user.email });

  return { 
    status: 200, 
    message: "Login successful", 
    token,
    refreshToken,
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

  // Generate tokens after successful verification
  const token = signAccessToken({ id: String(user._id), role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ id: String(user._id), role: user.role, email: user.email });

  return {
    status: 200,
    message: "Email verified successfully",
    token,
    refreshToken,
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
 
 * @param data - Email
 * @returns 
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

/**
 * Refresh authentication token
 * @param refreshToken - Refresh token
 * @returns AuthResponse
 */
export const refreshAuthToken = async (refreshToken?: string): Promise<AuthResponse> => {
  if (!refreshToken) {
    return { status: 401, message: "Refresh token is required" };
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return { status: 401, message: "User not found" };
    }

    if (!user.isVerified) {
      return { status: 403, message: "Please verify your email before accessing the system" };
    }

    // Generate new tokens
    const token = signAccessToken({ id: String(user._id), role: user.role, email: user.email });
    const newRefreshToken = signRefreshToken({ id: String(user._id), role: user.role, email: user.email });

    return {
      status: 200,
      message: "Token refreshed successfully",
      token,
      refreshToken: newRefreshToken,
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
  } catch (error: any) {
    return { status: 401, message: "Invalid or expired refresh token" };
  }
};

/**
 * Logout user
 * @returns AuthResponse
 */
export const logoutUser = async (): Promise<AuthResponse> => {
  return {
    status: 200,
    message: "Logged out successfully",
  };
};

/**
 * Request password reset
 * @param email - User email
 * @returns AuthResponse
 */
export const requestPasswordReset = async (email: string): Promise<AuthResponse> => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists for security
    return { status: 200, message: "If the email exists, a password reset link has been sent" };
  }

  // Generate reset token
  const resetToken = uuid();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Create or update password reset token
  await PasswordResetToken.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      token: resetToken,
      expiresAt,
      used: false,
    },
    { upsert: true, new: true }
  );

  // Send password reset email
  const resetUrl = `${process.env.APP_BASE_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  
  const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (resendClient && process.env.RESEND_API_KEY) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@dekingspalace.com";
    try {
      await resendClient.emails.send({
        from: fromEmail,
        to: user.email,
        subject: "Password Reset Request - DeKingsPalace",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: #ffffff; margin: 0;">DeKingsPalace</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333333; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #666666; font-size: 16px;">Hello ${user.fullName},</p>
              <p style="color: #666666; font-size: 16px;">You requested to reset your password. Click the button below to reset it:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #666666; font-size: 14px; margin-bottom: 5px;"><strong>This link will expire in 1 hour.</strong></p>
              <p style="color: #999999; font-size: 12px; margin-top: 0;">If you didn't request this, please ignore this email.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dddddd;">
                <p style="color: #999999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} DeKingsPalace. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  }

  return { status: 200, message: "If the email exists, a password reset link has been sent" };
};

/**
 * Reset password with token
 * @param token - Password reset token
 * @param newPassword - New password
 * @returns AuthResponse
 */
export const resetPassword = async (token: string, newPassword: string): Promise<AuthResponse> => {
  const resetTokenDoc = await PasswordResetToken.findOne({ token, used: false });
  
  if (!resetTokenDoc) {
    return { status: 400, message: "Invalid or expired reset token" };
  }

  if (resetTokenDoc.expiresAt < new Date()) {
    return { status: 400, message: "Reset token has expired" };
  }

  const user = await User.findById(resetTokenDoc.userId);
  if (!user) {
    return { status: 404, message: "User not found" };
  }

  // Update password (will be hashed by pre-save hook)
  user.password = newPassword;
  await user.save();

  // Mark token as used
  resetTokenDoc.used = true;
  await resetTokenDoc.save();

  return { status: 200, message: "Password reset successfully" };
};

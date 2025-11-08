import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(result.status).json(result);
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(result.status).json(result);
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Login failed",
    });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      res.status(400).json({
        status: 400,
        message: "Email and OTP are required",
      });
      return;
    }

    const result = await authService.verifyEmail({ email, otp });
    res.status(result.status).json(result);
  } catch (error: any) {
    console.error("Email verification error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Email verification failed",
    });
  }
};

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({
        status: 400,
        message: "Email is required",
      });
      return;
    }

    const result = await authService.resendOTP({ email });
    res.status(result.status).json(result);
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Failed to resend OTP",
    });
  }
};

import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  if (result.refreshToken) {
    setRefreshCookie(res, result.refreshToken);
  }
  res.status(result.status).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  if (result.refreshToken) {
    setRefreshCookie(res, result.refreshToken);
  }
  res.status(result.status).json(result);
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
    if (result.refreshToken) {
      setRefreshCookie(res, result.refreshToken);
    }
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

export const refresh = async (req: Request, res: Response) => {
  const tokenFromBody = (req.body && req.body.refreshToken) as string | undefined;
  const tokenFromCookie = req.cookies?.refreshToken as string | undefined;
  const result = await authService.refreshAuthToken(tokenFromBody || tokenFromCookie);
  if (result.refreshToken) setRefreshCookie(res, result.refreshToken);
  res.status(result.status).json(result);
};

export const logout = async (_req: Request, res: Response) => {
  clearRefreshCookie(res);
  const result = await authService.logoutUser();
  res.status(result.status).json(result);
};

export const forgotPassword = async (req: Request, res: Response) => {
  const result = await authService.requestPasswordReset(req.body.email);
  res.status(result.status).json(result);
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as any;
  const result = await authService.resetPassword(token, newPassword);
  res.status(result.status).json(result);
};

function setRefreshCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearRefreshCookie(res: Response) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

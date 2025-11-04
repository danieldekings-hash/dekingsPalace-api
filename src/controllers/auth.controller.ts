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

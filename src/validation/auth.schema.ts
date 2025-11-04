import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().min(2).max(100),
    email: z.string().email(),
    phoneNumber: z.string().min(7).max(20),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    referralCode: z.string().optional(),
    role: z.enum(["investor", "admin"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });



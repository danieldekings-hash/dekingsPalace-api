import express from "express";
import { register, login, refresh, logout, forgotPassword, resetPassword } from "../controllers/auth.controller";
import { validateBody } from "../middlewares/validation.middleware";
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } from "../validation/auth.schema";
const router = express.Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", validateBody(refreshSchema), refresh);
router.post("/logout", logout);
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);

export default router;

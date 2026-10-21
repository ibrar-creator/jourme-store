import { Router } from "express";
import {
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  refresh,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "./user.controller.js";
import { requireAuth, requireSameOrigin } from "./auth.middleware.js";
import {
  emailActionRateLimit,
  loginRateLimit,
  refreshRateLimit,
  registerRateLimit,
} from "./auth-rate-limit.middleware.js";

const router = Router();

router.post("/register", registerRateLimit, register);
router.post("/login", loginRateLimit, login);
router.post("/refresh", requireSameOrigin, refreshRateLimit, refresh);
router.post("/logout", requireSameOrigin, logout);
router.get("/verify-email", emailActionRateLimit, verifyEmail);
router.post("/verify-email", emailActionRateLimit, verifyEmail);
router.post("/resend-verification", emailActionRateLimit, resendVerification);
router.post("/forgot-password", emailActionRateLimit, forgotPassword);
router.post("/reset-password", emailActionRateLimit, resetPassword);
router.get("/me", requireAuth, getCurrentUser);

export default router;

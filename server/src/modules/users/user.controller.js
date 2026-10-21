import {
  getActiveUserById,
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
  requestPasswordReset,
  resendVerificationEmail,
  resetUserPassword,
  verifyUserEmail,
} from "./user.service.js";

const REFRESH_COOKIE_NAME = "jourme_refresh";
const REFRESH_COOKIE_PATH = "/api/users";
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  const configuredSameSite = (
    process.env.COOKIE_SAME_SITE || "strict"
  ).toLowerCase();
  const sameSite = ["strict", "lax", "none"].includes(configuredSameSite)
    ? configuredSameSite
    : "strict";

  return {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      sameSite === "none",
    sameSite,
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE,
    ...(process.env.COOKIE_DOMAIN
      ? { domain: process.env.COOKIE_DOMAIN }
      : {}),
  };
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, cookieOptions());
}

function clearRefreshCookie(res) {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, options);
}

function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

function validatePassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    Buffer.byteLength(password, "utf8") <= 72
  );
}

function sendSessionResponse(res, session, message) {
  setRefreshCookie(res, session.refreshToken);
  return res.status(200).json({
    success: true,
    message,
    data: {
      user: session.user,
      accessToken: session.accessToken,
      accessTokenExpiresIn: 600,
    },
  });
}

export async function register(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      role = "seller",
      storeName,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80 ||
      !isValidEmail(email) ||
      !validatePassword(password) ||
      !["customer", "seller"].includes(role) ||
      (role === "seller" &&
        (typeof storeName !== "string" ||
          storeName.trim().length < 2 ||
          storeName.trim().length > 80))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a name (2-80 characters), valid email, password (8-72 characters), and customer or seller role. Sellers must also provide a store name (2-80 characters).",
      });
    }

    const result = await registerUser({
      name,
      email,
      password,
      role,
      storeName,
    });
    return res.status(201).json({
      success: true,
      message: "Registration received. Check your email to verify your account.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (
      !isValidEmail(email) ||
      typeof password !== "string" ||
      !password ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid email and password are required.",
      });
    }

    const session = await loginUser({ email, password });
    return sendSessionResponse(res, session, "Login successful.");
  } catch (error) {
    return next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const session = await refreshUserSession(
      req.cookies?.[REFRESH_COOKIE_NAME]
    );
    return sendSessionResponse(res, session, "Session refreshed.");
  } catch (error) {
    clearRefreshCookie(res);
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await logoutUser(req.cookies?.[REFRESH_COOKIE_NAME]);
    clearRefreshCookie(res);
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const token = req.method === "GET" ? req.query?.token : req.body?.token;

    if (typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "A verification token is required.",
      });
    }

    const user = await verifyUserEmail(token);
    return res.status(200).json({
      success: true,
      message: "Email verified. You can now sign in.",
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
}

export async function resendVerification(req, res, next) {
  try {
    if (!isValidEmail(req.body?.email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required.",
      });
    }

    await resendVerificationEmail(req.body.email);
    return res.status(200).json({
      success: true,
      message: "If that account needs verification, an email has been sent.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    if (!isValidEmail(req.body?.email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required.",
      });
    }

    await requestPasswordReset(req.body.email);
    return res.status(200).json({
      success: true,
      message: "If an active account exists, password reset instructions have been sent.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== "string" || !validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "A valid reset token and a password of 8-72 characters are required.",
      });
    }

    await resetUserPassword({ token, password });
    clearRefreshCookie(res);
    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Sign in with your new password.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await getActiveUserById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account is unavailable.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
}

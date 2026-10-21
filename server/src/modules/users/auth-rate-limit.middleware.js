import rateLimit from "express-rate-limit";

function createLimiter({ windowMs, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler(req, res) {
      return res.status(429).json({
        success: false,
        message,
      });
    },
  });
}

export const registerRateLimit = createLimiter({
  windowMs:60 * 1000,
  limit: 10,
  message: "Too many registration attempts. Try again later.",
});

export const loginRateLimit = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many sign-in attempts. Try again in 15 minutes.",
  skipSuccessfulRequests: true,
});

export const emailActionRateLimit = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Too many email requests. Try again later.",
});

export const refreshRateLimit = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: "Too many session refresh requests. Sign in again later.",
});

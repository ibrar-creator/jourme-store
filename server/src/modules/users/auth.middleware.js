import { getActiveUserById, verifyAccessToken } from "./user.service.js";
import { getClientOrigin } from "./email.service.js";

export function requireSameOrigin(req, res, next) {
  const origin = req.get("origin");

  if (origin && origin !== getClientOrigin()) {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed.",
    });
  }

  return next();
}

export function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "A valid access token is required.",
    });
  }

  try {
    const payload = verifyAccessToken(match[1]);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !Number.isInteger(payload.authVersion) ||
      !["customer", "seller", "admin"].includes(payload.role)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token.",
      });
    }

    return getActiveUserById(payload.sub)
      .then((user) => {
        if (
          !user ||
          user.role !== payload.role ||
          user.authVersion !== payload.authVersion
        ) {
          return res.status(401).json({
            success: false,
            message: "Account is unavailable.",
          });
        }

        req.user = user;
        return next();
      })
      .catch(next);
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token.",
      });
    }

    return next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    return next();
  };
}

export const requireSeller = [requireAuth, requireRole("seller")];
export const requireCustomer = [requireAuth, requireRole("customer")];
export const requireAdmin = [requireAuth, requireRole("admin")];

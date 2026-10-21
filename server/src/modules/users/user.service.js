import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import AuthSession from "./auth-session.model.js";
import User from "./user.model.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./email.service.js";

const ACCESS_TOKEN_EXPIRES_IN = "10m";
const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_VERIFICATION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_LIFETIME_MS = 30 * 60 * 1000;
const TOKEN_ISSUER = "jourme-api";
const TOKEN_AUDIENCE = "jourme-users";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    const error = new Error(
      "JWT_SECRET must be configured with at least 32 characters."
    );
    error.statusCode = 500;
    throw error;
  }

  return secret;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createOneTimeToken() {
  return crypto.randomBytes(32).toString("hex");
}

function createAccessToken(user) {
  return jwt.sign(
    { role: user.role, authVersion: user.authVersion || 0 },
    getJwtSecret(),
    {
      subject: user._id.toString(),
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithm: "HS256",
    }
  );
}

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    storeName: user.storeName,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.emailVerified),
  };
}

function createAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createRefreshSession(user, familyId = crypto.randomUUID()) {
  const refreshToken = crypto.randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS);

  await AuthSession.create({
    userId: user._id,
    familyId,
    tokenHash: hashToken(refreshToken),
    authVersion: user.authVersion || 0,
    role: user.role,
    status: "current",
    expiresAt,
  });

  return { refreshToken, expiresAt };
}

async function issueTokens(user, familyId) {
  const { refreshToken, expiresAt } = await createRefreshSession(user, familyId);

  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user),
    refreshToken,
    refreshTokenExpiresAt: expiresAt,
  };
}

export async function registerUser({
  name,
  email,
  password,
  role = "seller",
  storeName,
}) {
  if (!["customer", "seller"].includes(role)) {
    throw createAuthError("Choose a valid account type.", 400);
  }

  if (
    role === "seller" &&
    (typeof storeName !== "string" ||
      storeName.trim().length < 2 ||
      storeName.trim().length > 80)
  ) {
    throw createAuthError(
      "Store name must be between 2 and 80 characters.",
      400
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createAuthError("Email is already registered.", 409);
  }

  const verificationToken = createOneTimeToken();
  const user = await User.create({
    name: name.trim(),
    ...(role === "seller" ? { storeName: storeName.trim() } : {}),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    role,
    emailVerified: false,
    emailVerificationTokenHash: hashToken(verificationToken),
    emailVerificationExpiresAt: new Date(
      Date.now() + EMAIL_VERIFICATION_LIFETIME_MS
    ),
  });

  try {
    await sendVerificationEmail(user.email, verificationToken, user.role);
  } catch (error) {
    await User.deleteOne({ _id: user._id, emailVerified: false });
    throw error;
  }

  return { user: toPublicUser(user) };
}

export async function loginUser({ email, password }) {
  getJwtSecret();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  const isMatch = user && await bcrypt.compare(password, user.password);

  if (!user || !isMatch || !user.isActive) {
    throw createAuthError("Invalid email or password.", 401);
  }

  if (!user.emailVerified) {
    throw createAuthError("Verify your email before signing in.", 403);
  }

  return issueTokens(user);
}

export async function refreshUserSession(refreshToken) {
  getJwtSecret();

  if (typeof refreshToken !== "string" || refreshToken.length < 40) {
    throw createAuthError("Refresh token is missing or invalid.", 401);
  }

  const tokenHash = hashToken(refreshToken);
  const session = await AuthSession.findOne({ tokenHash });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await AuthSession.deleteMany({ familyId: session.familyId });
    }
    throw createAuthError("Refresh session is invalid or expired.", 401);
  }

  if (session.status !== "current") {
    await AuthSession.deleteMany({ familyId: session.familyId });
    throw createAuthError("Refresh token reuse detected. Please sign in again.", 401);
  }

  const rotated = await AuthSession.updateOne(
    { _id: session._id, status: "current" },
    { $set: { status: "rotated" } }
  );

  if (rotated.modifiedCount !== 1) {
    await AuthSession.deleteMany({ familyId: session.familyId });
    throw createAuthError("Refresh token reuse detected. Please sign in again.", 401);
  }

  const user = await User.findOne({
    _id: session.userId,
    isActive: true,
    emailVerified: true,
  }).select("+authVersion");

  if (
    !user ||
    user.authVersion !== session.authVersion ||
    user.role !== session.role
  ) {
    await AuthSession.deleteMany({ familyId: session.familyId });
    throw createAuthError("Account is unavailable. Please sign in again.", 401);
  }

  try {
    return await issueTokens(user, session.familyId);
  } catch (error) {
    await AuthSession.deleteMany({ familyId: session.familyId });
    throw error;
  }
}

export async function logoutUser(refreshToken) {
  if (typeof refreshToken !== "string" || !refreshToken) {
    return;
  }

  const session = await AuthSession.findOne({
    tokenHash: hashToken(refreshToken),
  }).select("familyId");

  if (session) {
    await AuthSession.deleteMany({ familyId: session.familyId });
  }
}

export async function verifyUserEmail(token) {
  if (typeof token !== "string" || token.length !== 64) {
    throw createAuthError("Verification link is invalid or expired.", 400);
  }

  const user = await User.findOneAndUpdate(
    {
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpiresAt: { $gt: new Date() },
      emailVerified: false,
    },
    {
      $set: { emailVerified: true },
      $unset: {
        emailVerificationTokenHash: 1,
        emailVerificationExpiresAt: 1,
      },
    },
    { returnDocument: "after" }
  );

  if (!user) {
    throw createAuthError("Verification link is invalid or expired.", 400);
  }

  return toPublicUser(user);
}

export async function resendVerificationEmail(email) {
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
    emailVerified: false,
  });

  if (!user) return;

  const token = createOneTimeToken();
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_LIFETIME_MS
  );
  await user.save();
  await sendVerificationEmail(user.email, token, user.role);
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
    isActive: true,
  });

  if (!user) return;

  const token = createOneTimeToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_LIFETIME_MS);
  await user.save();
  await sendPasswordResetEmail(user.email, token, user.role);
}

export async function resetUserPassword({ token, password }) {
  if (typeof token !== "string" || token.length !== 64) {
    throw createAuthError("Password reset link is invalid or expired.", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate(
    {
      passwordResetTokenHash: hashToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
      isActive: true,
    },
    {
      $set: { password: hashedPassword },
      $inc: { authVersion: 1 },
      $unset: {
        passwordResetTokenHash: 1,
        passwordResetExpiresAt: 1,
      },
    },
    { returnDocument: "after" }
  ).select("+authVersion");

  if (!user) {
    throw createAuthError("Password reset link is invalid or expired.", 400);
  }

  await AuthSession.deleteMany({ userId: user._id });
}

export async function getActiveUserById(id) {
  const user = await User.findOne({
    _id: id,
    isActive: true,
    emailVerified: true,
  }).select("+authVersion");

  return user
    ? { ...toPublicUser(user), authVersion: user.authVersion || 0 }
    : null;
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  });
}

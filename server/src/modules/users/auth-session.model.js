import mongoose from "mongoose";

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    authVersion: {
      type: Number,
      required: true,
      default: 0,
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      required: true,
    },
    status: {
      type: String,
      enum: ["current", "rotated"],
      default: "current",
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  { timestamps: true }
);

const AuthSession = mongoose.model("AuthSession", authSessionSchema);

export default AuthSession;

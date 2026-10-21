
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    storeName: {
      type: String,
      required: function () {
        return this.role === "seller";
      },
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationTokenHash: {
      type: String,
      select: false,
    },

    emailVerificationExpiresAt: {
      type: Date,
      select: false,
    },

    passwordResetTokenHash: {
      type: String,
      select: false,
    },

    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },

    authVersion: {
      type: Number,
      default: 0,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;

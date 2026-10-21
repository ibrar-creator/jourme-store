import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn(
      "MONGODB_URI is missing. Starting API without database connection."
    );
    return false;
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB connected successfully.");

  return true;
}
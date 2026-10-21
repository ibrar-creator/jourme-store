import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    service: "Jourme API",
    status: "healthy",
    database: databaseConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

export default router;
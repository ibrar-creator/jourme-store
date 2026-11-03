
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import healthRoutes from "./modules/health/health.route.js";
import productRoutes from "./modules/products/product.routes.js";
import orderRoutes from "../modules/orders/order.routes.js";
import userRoutes from "./modules/users/user.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.disable("x-powered-by");

// Trust proxy
const trustProxyHops = Number.parseInt(
  process.env.TRUST_PROXY_HOPS || "0",
  10
);

if (Number.isInteger(trustProxyHops) && trustProxyHops >= 0) {
  app.set("trust proxy", trustProxyHops);
}

// Security
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,

    contentSecurityPolicy: {
      directives: {
        imgSrc: [
          "'self'",
          "data:",
          "https://images.unsplash.com",
        ],

        connectSrc: [
          "'self'",
        ],
      },
    },
  })
);

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body and cookie parsing
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// API welcome route
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Jourme API!",
  });
});

// API routes
app.use("/api/health", healthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

// Frontend production build
const frontendDir = path.resolve(__dirname, "../dist");

// Serve frontend assets
app.use(express.static(frontendDir));

// Frontend entry point
app.get("/", (req, res, next) => {
  res.sendFile(path.join(frontendDir, "index.html"), (error) => {
    if (error) next(error);
  });
});

// Handle frontend routes (React Router)
app.get("/*any", (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path === "/api") {
    return res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }

  return res.sendFile(path.join(frontendDir, "index.html"), (error) => {
    if (error) next(error);
  });
});

// General 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : Number.isInteger(error.status)
      ? error.status
      : 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "An unexpected server error occurred."
        : error.message,
  });
});

export default app;

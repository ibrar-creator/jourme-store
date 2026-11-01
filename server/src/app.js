import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import healthRoutes from "./modules/health/health.route.js";
import productRoutes from "./modules/products/product.routes.js";
import orderRoutes from "../modules/orders/order.routes.js";
import userRoutes from "./modules/users/user.routes.js"; // Import user routes to ensure they are registered

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.disable("x-powered-by");
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || "0", 10);
if (Number.isInteger(trustProxyHops) && trustProxyHops >= 0) {
  app.set("trust proxy", trustProxyHops);
}

// Express app mein yeh configuration update karein
app.use(helmet({
  crossOriginOpenerPolicy: false, // COOP error khatam karne ke liye
  originAgentCluster: false      // Cluster error khatam karne ke liye
}));


app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Jourme API",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

const publicDir = path.join(__dirname, "..", "public");

app.use(express.static(publicDir));
app.get("*any", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }

  return res.sendFile(path.join(publicDir, "index.html"));
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

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
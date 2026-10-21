
import { Router } from "express";
import { createOrder, getSellerOrders } from "./order.controller.js";
import {
  requireAuth,
  requireRole,
  requireSeller,
} from "../../src/modules/users/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, requireRole("customer", "seller"), createOrder);
router.get("/seller", requireSeller, getSellerOrders);

export default router;

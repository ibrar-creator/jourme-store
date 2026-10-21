
import { Router } from "express";
import {
  createProduct,
  listProducts,
  listSellerProducts,
  showProduct,
  updateProduct,
  updateProductStatus,
} from "./product.controller.js";
import { requireSeller } from "../users/auth.middleware.js";

const router = Router();

router.get("/mine", requireSeller, listSellerProducts);
router.post("/", requireSeller, createProduct);
router.patch("/:id", requireSeller, updateProduct);
router.patch("/:id/status", requireSeller, updateProductStatus);
router.get("/", listProducts);
router.get("/:id", showProduct);

export default router;


import mongoose from "mongoose";
import {
  getProducts,
  getProductById,
  createSellerProduct,
  updateSellerProduct,
  setSellerProductActive,
  getSellerProducts,
} from "./product.service.js";

const allowedCategories = [
  "Clothing",
  "Accessories",
  "Footwear",
];

function isHttpUrl(value) {
  if (typeof value !== "string" || value.length > 2048) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validateProductInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A product object is required.";
  }

  const { name, description, category, price, compareAtPrice, image, sku, variants } = body;

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 150) {
    return "Product name must be between 2 and 150 characters.";
  }

  if (typeof description !== "string" || !description.trim() || description.length > 3000) {
    return "Product description is required and must not exceed 3000 characters.";
  }

  if (!allowedCategories.includes(category)) {
    return "Choose a valid product category.";
  }

  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return "Price must be a valid non-negative number.";
  }

  if (
    compareAtPrice != null &&
    (typeof compareAtPrice !== "number" ||
      !Number.isFinite(compareAtPrice) ||
      compareAtPrice < price)
  ) {
    return "Compare-at price must be a valid number equal to or higher than the price.";
  }

  if (!isHttpUrl(image)) {
    return "Provide a valid HTTP or HTTPS product image URL.";
  }

  if (
    typeof sku !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,49}$/.test(sku.trim())
  ) {
    return "SKU must be 2-50 characters and use only letters, numbers, hyphens, or underscores.";
  }

  if (!Array.isArray(variants) || variants.length === 0 || variants.length > 100) {
    return "Add between 1 and 100 product variants.";
  }

  const variantSkus = new Set();

  for (const variant of variants) {
    if (!variant || typeof variant !== "object" || Array.isArray(variant)) {
      return "Each variant must contain a SKU, color, size, and stock quantity.";
    }

    const variantSku =
      typeof variant.sku === "string" ? variant.sku.trim().toUpperCase() : "";
    const color = typeof variant.color === "string" ? variant.color.trim() : "";
    const size = typeof variant.size === "string" ? variant.size.trim() : "";

    if (!/^[A-Z0-9][A-Z0-9_-]{1,49}$/.test(variantSku)) {
      return "Each variant SKU must be 2-50 characters and use only letters, numbers, hyphens, or underscores.";
    }

    if (variantSkus.has(variantSku)) {
      return "Variant SKUs must be unique within this product.";
    }
    variantSkus.add(variantSku);

    if (!color || color.length > 50 || !size || size.length > 30) {
      return "Each variant needs a color (up to 50 characters) and size (up to 30 characters).";
    }

    if (
      typeof variant.stock !== "number" ||
      !Number.isInteger(variant.stock) ||
      variant.stock < 0 ||
      variant.stock > 1000000
    ) {
      return "Variant stock must be a whole number between 0 and 1,000,000.";
    }

    if (variant.image != null && variant.image !== "" && !isHttpUrl(variant.image)) {
      return "Variant image must be a valid HTTP or HTTPS URL.";
    }
  }

  return null;
}

function productFieldsFromBody(body) {
  const { name, description, category, price, compareAtPrice, image, sku, variants } = body;
  return {
    name: name.trim(),
    description: description.trim(),
    category,
    price,
    compareAtPrice: compareAtPrice ?? null,
    image: image.trim(),
    sku: sku.trim().toUpperCase(),
    variants: variants.map((variant) => ({
      ...(variant._id ? { _id: variant._id } : {}),
      sku: variant.sku.trim().toUpperCase(),
      color: variant.color.trim(),
      size: variant.size.trim(),
      stock: variant.stock,
      image: variant.image?.trim() || null,
      isActive: variant.isActive !== false,
    })),
  };
}

export async function listProducts(req, res, next) {
  try {
    const category =
      typeof req.query.category === "string"
        ? req.query.category
        : undefined;

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 100)
        : "";

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product category",
      });
    }

    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 12)
    );

    const result = await getProducts({
      category,
      search,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function showProduct(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function listSellerProducts(req, res, next) {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 12)
    );

    const result = await getSellerProducts({
      sellerId: req.user.id,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
      summary: result.summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const validationError = validateProductInput(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const product = await createSellerProduct({
      sellerId: req.user.id,
      product: productFieldsFromBody(req.body),
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This product or variant SKU is already in use.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const validationError = validateProductInput(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const product = await updateSellerProduct({
      sellerId: req.user.id,
      productId: req.params.id,
      product: productFieldsFromBody(req.body),
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This product or variant SKU is already in use.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
}

export async function updateProductStatus(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    if (
      !req.body ||
      typeof req.body.isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const product = await setSellerProductActive({
      sellerId: req.user.id,
      productId: req.params.id,
      isActive: req.body.isActive,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: req.body.isActive
        ? "Product activated successfully."
        : "Product deactivated successfully.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

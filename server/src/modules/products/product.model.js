
import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "Variant SKU is required"],
      uppercase: true,
      trim: true,
    },

    color: {
      type: String,
      required: [true, "Variant color is required"],
      trim: true,
      maxlength: 50,
    },

    size: {
      type: String,
      required: [true, "Variant size is required"],
      trim: true,
      maxlength: 30,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Variant stock must be a whole number",
      },
    },

    image: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: 3000,
    },

    category: {
      type: String,
      required: true,
      enum: ["Clothing", "Accessories", "Footwear"],
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    image: {
      type: String,
      required: true,
    },

    // Compatibility field for existing product listing code.
    // Its value is recalculated from variant stock before validation.
    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },

    // Product-level identifier; each variant has its own separate SKU.
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    variants: {
      type: [variantSchema],
      default: [],
      validate: {
        validator(variants) {
          const skus = variants.map((variant) =>
            variant.sku?.trim().toUpperCase()
          );

          return (
            skus.every(Boolean) &&
            new Set(skus).size === skus.length
          );
        },
        message: "Each variant must have a unique SKU within its product",
      },
    },

    isFeatured: {
      type: Boolean,
      default: false,
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

// Keep the legacy stock field synchronized with variant inventory.
productSchema.pre("validate", function () {
  if (this.variants?.length) {
    this.stock = this.variants.reduce(
      (total, variant) => total + variant.stock,
      0
    );
  }
});

productSchema.index({ isActive: 1, category: 1, price: 1 });
productSchema.index({ name: "text", description: "text" });

// Enforce variant SKU uniqueness across different products too.
productSchema.index(
  { "variants.sku": 1 },
  { unique: true, sparse: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;

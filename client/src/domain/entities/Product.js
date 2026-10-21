
const VALID_CATEGORIES = ["Clothing", "Accessories", "Footwear"];

export function normalizeProduct(rawProduct) {
  if (!rawProduct || typeof rawProduct !== "object") {
    throw new Error("Invalid product data.");
  }

  const price = Number(rawProduct.price);

  if (
    !rawProduct._id ||
    !rawProduct.name ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new Error("Product must have a valid ID, name, and price.");
  }

  const variants = Array.isArray(rawProduct.variants)
    ? rawProduct.variants.map((variant) => ({
        _id: String(variant._id ?? ""),
        sku: String(variant.sku ?? ""),
        color: String(variant.color ?? ""),
        size: String(variant.size ?? ""),
        stock: Math.max(0, Number(variant.stock) || 0),
        image: String(variant.image ?? ""),
        isActive: variant.isActive !== false,
      }))
    : [];

  return {
    _id: String(rawProduct._id),
    name: String(rawProduct.name).trim(),
    slug: String(rawProduct.slug ?? ""),
    description: String(rawProduct.description ?? ""),
    category: VALID_CATEGORIES.includes(rawProduct.category)
      ? rawProduct.category
      : "Clothing",
    price,
    compareAtPrice:
      rawProduct.compareAtPrice == null
        ? null
        : Number(rawProduct.compareAtPrice),
    image: String(rawProduct.image ?? ""),
    stock: Math.max(0, Number(rawProduct.stock) || 0),
    sku: String(rawProduct.sku ?? ""),
    variants,
    isFeatured: Boolean(rawProduct.isFeatured),
    isActive: rawProduct.isActive !== false,
  };
}

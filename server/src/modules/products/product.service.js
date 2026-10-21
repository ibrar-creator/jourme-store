
import mongoose from "mongoose";
import Product from "./product.model.js";

function addSellerStoreName(product) {
  if (!product) return product;

  const seller = product.sellerId;
  return {
    ...product,
    sellerId: seller?._id || seller || null,
    sellerStoreName: seller?.storeName || null,
  };
}

export async function getProducts({ category, search, page, limit }) {
  const filter = { isActive: true };

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("sellerId", "storeName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .then((products) => products.map(addSellerStoreName)),

    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductById(id) {
  const product = await Product.findOne({
    _id: id,
    isActive: true,
  })
    .populate("sellerId", "storeName")
    .lean();

  return addSellerStoreName(product);
}

export async function createSellerProduct({ sellerId, product }) {
  const baseSlug = `${product.name}-${product.sku}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || product.sku.toLowerCase();
  let slug = baseSlug;
  let suffix = 2;

  while (await Product.exists({ slug })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return Product.create({
    ...product,
    sellerId,
    slug,
  });
}

export async function updateSellerProduct({ sellerId, productId, product }) {
  const existingProduct = await Product.findOne({
    _id: productId,
    sellerId,
  });

  if (!existingProduct) {
    return null;
  }

  Object.assign(existingProduct, product);
  await existingProduct.save();
  return existingProduct;
}

export async function setSellerProductActive({ sellerId, productId, isActive }) {
  return Product.findOneAndUpdate(
    { _id: productId, sellerId },
    { $set: { isActive } },
    { returnDocument: "after", runValidators: true }
  );
}

export async function getSellerProducts({ sellerId, page, limit }) {
  const filter = { sellerId: new mongoose.Types.ObjectId(sellerId) };
  const skip = (page - 1) * limit;

  const [products, total, summaryRows] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
    Product.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          activeProducts: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
          inactiveProducts: {
            $sum: { $cond: ["$isActive", 0, 1] },
          },
          totalStock: { $sum: "$stock" },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $and: ["$isActive", { $lte: ["$stock", 5] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const summary = summaryRows[0] || {
    activeProducts: 0,
    inactiveProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
  };

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    summary,
  };
}

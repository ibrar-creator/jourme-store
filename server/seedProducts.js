
import "dotenv/config";
import mongoose from "mongoose";
import Product from "./src/modules/products/product.model.js";

const image = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;

const makeVariants = (prefix, colors, sizes, stock ) =>
  colors.flatMap((color) =>
    sizes.map((size) => ({
      sku: `JRM-${prefix}-${color.code}-${size.code}`,
      color: color.name,
      size: size.name,
      stock: stock,
      isActive: true,
    }))
  );

const products = [
  {
    name: "Essential Cotton Shirt",
    slug: "essential-cotton-shirt",
    description: "A timeless cotton shirt designed for everyday comfort, versatility and effortless style.",
    category: "Clothing",
    price: 3490,
    compareAtPrice: 4290,
    image: image("photo-1598033129183-c4f50c736f10"),
    sku: "JRM-CLT-001",
    variants: makeVariants("SHR", [
      { name: "White", code: "WHT" },
      { name: "Black", code: "BLK" },
    ], [
      { name: "S", code: "S" },
      { name: "M", code: "M" },
      { name: "L", code: "L" },
    ], 4),
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Everyday Leather Bag",
    slug: "everyday-leather-bag",
    description: "A clean, functional everyday bag with a refined silhouette and practical storage.",
    category: "Accessories",
    price: 5990,
    compareAtPrice: 6990,
    image: image("photo-1548036328-c9fa89d128fa"),
    sku: "JRM-ACC-001",
    variants: makeVariants("BAG", [
      { name: "Black", code: "BLK" },
      { name: "Brown", code: "BRN" },
    ], [{ name: "One Size", code: "OS" }], 8),
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Minimal Everyday Sneakers",
    slug: "minimal-everyday-sneakers",
    description: "Minimal sneakers made to complement your daily wardrobe with understated style.",
    category: "Footwear",
    price: 7490,
    compareAtPrice: 8990,
    image: image("photo-1542291026-7eec264c27ff"),
    sku: "JRM-FOT-001",
    variants: makeVariants("SNK", [
      { name: "White", code: "WHT" },
      { name: "Black", code: "BLK" },
    ], [
      { name: "40", code: "40" },
      { name: "41", code: "41" },
      { name: "42", code: "42" },
      { name: "43", code: "43" },
    ], 3),
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Classic Black Watch",
    slug: "classic-black-watch",
    description: "A sophisticated everyday timepiece with a minimal design and versatile finish.",
    category: "Accessories",
    price: 8990,
    compareAtPrice: null,
    image: image("photo-1524592094714-0f0654e20314"),
    sku: "JRM-ACC-002",
    variants: makeVariants("WCH", [
      { name: "Black", code: "BLK" },
      { name: "Silver", code: "SLV" },
    ], [{ name: "One Size", code: "OS" }], 5),
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Oversized Essential Tee",
    slug: "oversized-essential-tee",
    description: "A relaxed-fit cotton tee with a clean silhouette for everyday wear.",
    category: "Clothing",
    price: 1990,
    compareAtPrice: 2490,
    image: image("photo-1521572163474-6864f9cf17ab"),
    sku: "JRM-CLT-002",
    variants: makeVariants("TEE", [
      { name: "Black", code: "BLK" },
      { name: "White", code: "WHT" },
      { name: "Beige", code: "BEG" },
    ], [
      { name: "S", code: "S" },
      { name: "M", code: "M" },
      { name: "L", code: "L" },
      { name: "XL", code: "XL" },
    ]),
    isFeatured: true,
  },
  {
    name: "Classic Polo Shirt",
    slug: "classic-polo-shirt",
    description: "A versatile polo with a refined everyday fit.",
    category: "Clothing",
    price: 2790,
    compareAtPrice: 3290,
    image: image("photo-1625910513413-5fc45e6d2c8b"),
    sku: "JRM-CLT-003",
    variants: makeVariants("POL", [
      { name: "Navy", code: "NVY" },
      { name: "White", code: "WHT" },
    ], [
      { name: "S", code: "S" },
      { name: "M", code: "M" },
      { name: "L", code: "L" },
      { name: "XL", code: "XL" },
    ]),
  },
  {
    name: "Everyday Hoodie",
    slug: "everyday-hoodie",
    description: "A soft, comfortable hoodie designed for layering.",
    category: "Clothing",
    price: 4490,
    compareAtPrice: 4990,
    image: image("photo-1556821840-3a63f95609a7"),
    sku: "JRM-CLT-004",
    variants: makeVariants("HOD", [
      { name: "Black", code: "BLK" },
      { name: "Grey", code: "GRY" },
    ], [
      { name: "S", code: "S" },
      { name: "M", code: "M" },
      { name: "L", code: "L" },
      { name: "XL", code: "XL" },
    ]),
  },
  {
    name: "Relaxed Sweatshirt",
    slug: "relaxed-sweatshirt",
    description: "A minimalist sweatshirt with a relaxed everyday shape.",
    category: "Clothing",
    price: 3990,
    compareAtPrice: null,
    image: image("photo-1578681994506-b8f463449011"),
    sku: "JRM-CLT-005",
    variants: makeVariants("SWT", [
      { name: "Cream", code: "CRM" },
      { name: "Charcoal", code: "CHR" },
    ], [
      { name: "S", code: "S" },
      { name: "M", code: "M" },
      { name: "L", code: "L" },
    ]),
  },
  {
    name: "Relaxed Fit Trousers",
    slug: "relaxed-fit-trousers",
    description: "Tailored trousers combining comfort and a clean modern fit.",
    category: "Clothing",
    price: 4290,
    compareAtPrice: 4790,
    image: image("photo-1473966968600-fa801b869a1a"),
    sku: "JRM-CLT-006",
    variants: makeVariants("TRS", [
      { name: "Black", code: "BLK" },
      { name: "Beige", code: "BEG" },
    ], [
      { name: "30", code: "30" },
      { name: "32", code: "32" },
      { name: "34", code: "34" },
      { name: "36", code: "36" },
    ]),
  },
  {
    name: "Linen Summer Shorts",
    slug: "linen-summer-shorts",
    description: "Lightweight shorts made for warm days and effortless styling.",
    category: "Clothing",
    price: 2490,
    compareAtPrice: null,
    image: image("photo-1591195853828-11db59a44f6b"),
    sku: "JRM-CLT-007",
    variants: makeVariants("SHT", [
      { name: "Sand", code: "SND" },
      { name: "Black", code: "BLK" },
    ], [
      { name: "S", code: "S" },
      { name: "M", code: "M" },
      { name: "L", code: "L" },
    ]),
  },
  {
    name: "Leather Loafers",
    slug: "leather-loafers",
    description: "Classic loafers with a streamlined silhouette.",
    category: "Footwear",
    price: 8490,
    compareAtPrice: 9490,
    image: image("photo-1531310197839-ccf54634509e"),
    sku: "JRM-FOT-002",
    variants: makeVariants("LOF", [
      { name: "Black", code: "BLK" },
      { name: "Brown", code: "BRN" },
    ], [
      { name: "40", code: "40" },
      { name: "41", code: "41" },
      { name: "42", code: "42" },
      { name: "43", code: "43" },
    ]),
  },
  {
    name: "Minimal Everyday Slides",
    slug: "minimal-everyday-slides",
    description: "Easy everyday slides with a minimal profile.",
    category: "Footwear",
    price: 1990,
    compareAtPrice: null,
    image: image("photo-1603487742131-4160ec999306"),
    sku: "JRM-FOT-003",
    variants: makeVariants("SLD", [
      { name: "Black", code: "BLK" },
      { name: "Cream", code: "CRM" },
    ], [
      { name: "40", code: "40" },
      { name: "41", code: "41" },
      { name: "42", code: "42" },
      { name: "43", code: "43" },
    ], 40),
  },
  {
    name: "Canvas Sneakers",
    slug: "canvas-sneakers",
    description: "Lightweight canvas sneakers for casual everyday outfits.",
    category: "Footwear",
    price: 3990,
    compareAtPrice: 4490,
    image: image("photo-1525966222134-fcfa99b8ae77"),
    sku: "JRM-FOT-004",
    variants: makeVariants("CVS", [
      { name: "White", code: "WHT" },
      { name: "Navy", code: "NVY" },
    ], [
      { name: "40", code: "40" },
      { name: "41", code: "41" },
      { name: "42", code: "42" },
      { name: "43", code: "43" },
    ]),
  },
  {
    name: "Classic Everyday Boots",
    slug: "classic-everyday-boots",
    description: "Durable everyday boots with a timeless profile.",
    category: "Footwear",
    price: 9990,
    compareAtPrice: null,
    image: image("photo-1542291026-7eec264c27ff"),
    sku: "JRM-FOT-005",
    variants: makeVariants("BOT", [
      { name: "Black", code: "BLK" },
      { name: "Brown", code: "BRN" },
    ], [
      { name: "40", code: "40" },
      { name: "41", code: "41" },
      { name: "42", code: "42" },
      { name: "43", code: "43" },
    ]),
  },
  {
    name: "Minimal Leather Wallet",
    slug: "minimal-leather-wallet",
    description: "A compact wallet with practical everyday storage.",
    category: "Accessories",
    price: 2490,
    compareAtPrice: null,
    image: image("photo-1627123424574-724758594e93"),
    sku: "JRM-ACC-003",
    variants: makeVariants("WAL", [
      { name: "Black", code: "BLK" },
      { name: "Brown", code: "BRN" },
    ], [{ name: "One Size", code: "OS" }]),
  },
  {
    name: "Minimal Leather Belt",
    slug: "minimal-leather-belt",
    description: "A versatile belt with understated hardware.",
    category: "Accessories",
    price: 2290,
    compareAtPrice: null,
    image: image("photo-1624222247344-550fb8c7c9f7"),
    sku: "JRM-ACC-004",
    variants: makeVariants("BLT", [
      { name: "Black", code: "BLK" },
      { name: "Brown", code: "BRN" },
    ], [
      { name: "M", code: "M" },
      { name: "L", code: "L" },
      { name: "XL", code: "XL" },
    ]),
  },
  {
    name: "Everyday Baseball Cap",
    slug: "everyday-baseball-cap",
    description: "A clean baseball cap with an adjustable fit.",
    category: "Accessories",
    price: 1490,
    compareAtPrice: null,
    image: image("photo-1588850561407-ed78c282e89b"),
    sku: "JRM-ACC-005",
    variants: makeVariants("CAP", [
      { name: "Black", code: "BLK" },
      { name: "Beige", code: "BEG" },
      { name: "Navy", code: "NVY" },
    ], [{ name: "One Size", code: "OS" }]),
  },
  {
    name: "Everyday Crossbody Bag",
    slug: "everyday-crossbody-bag",
    description: "A compact crossbody bag for daily essentials.",
    category: "Accessories",
    price: 3990,
    compareAtPrice: 4490,
    image: image("photo-1553062407-98eeb64c6a62"),
    sku: "JRM-ACC-006",
    variants: makeVariants("CRB", [
      { name: "Black", code: "BLK" },
      { name: "Brown", code: "BRN" },
    ], [{ name: "One Size", code: "OS" }]),
  },
  {
    name: "Everyday Cotton Socks",
    slug: "everyday-cotton-socks",
    description: "Soft everyday socks designed for comfort and daily use.",
    category: "Accessories",
    price: 590,
    compareAtPrice: null,
    image: image("photo-1586350977771-b3b0abd50c82"),
    sku: "JRM-ACC-007",
    variants: makeVariants("SOC", [
      { name: "White", code: "WHT" },
      { name: "Black", code: "BLK" },
    ], [{ name: "One Size", code: "OS" }], 12),
  },
];

async function seedProducts() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing from your .env file.");
    }

    if (products.length !== 20) {
      throw new Error(`Expected 20 products, received ${products.length}.`);
    }

    // Validate variant SKU uniqueness across the complete seed catalog.
    const allVariantSkus = products.flatMap((product) =>
      product.variants.map((variant) => variant.sku)
    );

    if (new Set(allVariantSkus).size !== allVariantSkus.length) {
      throw new Error("Duplicate variant SKU found in seed catalog.");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    for (const productData of products) {
      const totalStock = productData.variants.reduce(
        (total, variant) => total + variant.stock,
        0
      );

      await Product.findOneAndUpdate(
        { slug: productData.slug },
        {
          $set: {
            ...productData,
            stock: totalStock,
          },
          $setOnInsert: {},
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    console.log(`Successfully seeded ${products.length} Jourme products.`);
  } catch (error) {
    console.error("Product seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await seedProducts();

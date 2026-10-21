
import mongoose from "mongoose";
import crypto from "node:crypto";
import Product from "../../src/modules/products/product.model.js";
import Order from "./order.model.js";

const SHIPPING_FEE = 0;

function validateShippingAddress(address) {
  const requiredFields = [
    "fullName",
    "email",
    "phone",
    "addressLine",
    "city",
    "postalCode",
    "country",
  ];

  if (!address || typeof address !== "object") {
    return "Shipping address is required.";
  }

  for (const field of requiredFields) {
    if (
      typeof address[field] !== "string" ||
      !address[field].trim()
    ) {
      return `${field} is required.`;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) {
    return "Please provide a valid email address.";
  }

  return null;
}

export async function createOrder(req, res) {
  const { items, shippingAddress } = req.body ?? {};

  const addressError = validateShippingAddress(shippingAddress);

  if (addressError) {
    return res.status(400).json({
      success: false,
      message: addressError,
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Your cart is empty.",
    });
  }

  if (items.length > 50) {
    return res.status(400).json({
      success: false,
      message: "Too many different products in one order.",
    });
  }

  // Each cart line must identify both the product and selected variant.
  const quantities = new Map();

  for (const item of items) {
    const productId = String(item?.productId ?? "");
    const variantId = String(item?.variantId ?? "");
    const quantity = Number(item?.quantity);

    if (
      !mongoose.isValidObjectId(productId) ||
      !mongoose.isValidObjectId(variantId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A product or variant ID is invalid.",
      });
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
      return res.status(400).json({
        success: false,
        message: "Each quantity must be between 1 and 100.",
      });
    }

    const key = `${productId}:${variantId}`;
    const existing = quantities.get(key);

    quantities.set(key, {
      productId,
      variantId,
      quantity: (existing?.quantity ?? 0) + quantity,
    });
  }

  if ([...quantities.values()].some((item) => item.quantity > 100)) {
    return res.status(400).json({
      success: false,
      message: "Requested quantity exceeds the allowed limit.",
    });
  }

  const session = await mongoose.startSession();

  try {
    let createdOrder;

    await session.withTransaction(async () => {
      const orderItems = [];
      let subtotal = 0;

      for (const { productId, variantId, quantity } of quantities.values()) {
        // Atomically check availability and deduct only the chosen variant.
        const product = await Product.findOneAndUpdate(
          {
            _id: productId,
            isActive: true,
            variants: {
              $elemMatch: {
                _id: new mongoose.Types.ObjectId(variantId),
                isActive: true,
                stock: { $gte: quantity },
              },
            },
          },
          {
            $inc: {
              "variants.$.stock": -quantity,
              stock: -quantity,
            },
          },
          {
            returnDocument: "after",
            session,
          }
        );

        if (!product) {
          throw new Error(`PRODUCT_UNAVAILABLE:${productId}:${variantId}`);
        }

        const variant = product.variants.id(variantId);

        if (!variant) {
          throw new Error(`PRODUCT_UNAVAILABLE:${productId}:${variantId}`);
        }

        const lineTotal = product.price * quantity;
        subtotal += lineTotal;

        orderItems.push({
          sellerId: product.sellerId || null,
          product: product._id,
          variantId: variant._id,
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          name: product.name,
          image: variant.image || product.image,
          price: product.price,
          quantity,
        });
      }

      const total = subtotal + SHIPPING_FEE;

      const [order] = await Order.create(
        [
          {
            customerId: req.user.id,
            orderNumber: `JRM-${crypto
              .randomUUID()
              .replace(/-/g, "")
              .slice(0, 12)
              .toUpperCase()}`,
            items: orderItems,
            shippingAddress: {
              fullName: shippingAddress.fullName.trim(),
              email: shippingAddress.email.trim().toLowerCase(),
              phone: shippingAddress.phone.trim(),
              addressLine: shippingAddress.addressLine.trim(),
              city: shippingAddress.city.trim(),
              postalCode: shippingAddress.postalCode.trim(),
              country: shippingAddress.country.trim(),
            },
            subtotal,
            shippingFee: SHIPPING_FEE,
            total,
          },
        ],
        { session }
      );

      createdOrder = order;
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: {
        orderNumber: createdOrder.orderNumber,
        status: createdOrder.status,
        paymentStatus: createdOrder.paymentStatus,
        items: createdOrder.items,
        subtotal: createdOrder.subtotal,
        shippingFee: createdOrder.shippingFee,
        total: createdOrder.total,
        createdAt: createdOrder.createdAt,
      },
    });
  } catch (error) {
    if (error.message.startsWith("PRODUCT_UNAVAILABLE:")) {
      return res.status(409).json({
        success: false,
        message:
          "The selected size or color is unavailable, or there is not enough stock. Refresh your cart and try again.",
      });
    }

    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create your order right now.",
    });
  } finally {
    await session.endSession();
  }
}

export async function getSellerOrders(req, res) {
  const pageValue = Number.parseInt(req.query.page, 10);
  const limitValue = Number.parseInt(req.query.limit, 10);
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const limit =
    Number.isInteger(limitValue) && limitValue > 0
      ? Math.min(limitValue, 50)
      : 20;
  const sellerId = new mongoose.Types.ObjectId(req.user.id);
  const filter = { "items.sellerId": sellerId };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select("orderNumber items shippingAddress status paymentStatus createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: orders.map((order) => {
      const items = order.items.filter((item) =>
        item.sellerId?.equals(sellerId)
      );
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        items: items.map(({ sellerId: _sellerId, ...item }) => item),
        subtotal,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

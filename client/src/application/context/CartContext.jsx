
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { normalizeProduct } from "../../domain/entities/Product.js";

import {
  getCartItemCount,
  getCartSubtotal,
} from "../../domain/utils/cartCalculations.js";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "jourme-cart";

function getVariantStock(product, variantId) {
  const variant = product.variants?.find(
    (item) => String(item._id) === String(variantId)
  );

  return variant?.stock ?? 0;
}

function readStoredCart() {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!storedCart) return [];

    const parsedCart = JSON.parse(storedCart);

    if (!Array.isArray(parsedCart)) return [];

    return parsedCart
      .filter(
        (item) =>
          item?.product &&
          item?.variantId &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      )
      .map((item) => {
        const product = normalizeProduct(item.product);

        const variant = product.variants?.find(
          (entry) =>
            String(entry._id) === String(item.variantId)
        );

        if (!variant || !variant.isActive || variant.stock < 1) {
          return null;
        }

        return {
          product,
          variantId: String(variant._id),
          quantity: Math.min(item.quantity, variant.stock),
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function persistCart(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Cart remains usable in memory if storage is unavailable.
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readStoredCart);

  const saveCart = useCallback((nextItems) => {
    persistCart(nextItems);
    setCartItems(nextItems);
  }, []);

  const addToCart = useCallback(
    (rawProduct, variantId, quantity = 1) => {
      const product = normalizeProduct(rawProduct);
      const amount = Math.floor(Number(quantity));

      if (!Number.isFinite(amount) || amount < 1) {
        throw new Error("Quantity must be at least 1.");
      }

      const variant = product.variants?.find(
        (item) => String(item._id) === String(variantId)
      );

      if (!variant || !variant.isActive) {
        throw new Error("Please select a valid product variant.");
      }

      if (variant.stock < 1) {
        throw new Error("This size and color are out of stock.");
      }

      setCartItems((currentItems) => {
        const existingItem = currentItems.find(
          (item) =>
            item.product._id === product._id &&
            item.variantId === String(variant._id)
        );

        const currentQuantity = existingItem?.quantity ?? 0;
        const nextQuantity = Math.min(
          currentQuantity + amount,
          variant.stock
        );

        const nextItems = existingItem
          ? currentItems.map((item) =>
              item.product._id === product._id &&
              item.variantId === String(variant._id)
                ? {
                    product,
                    variantId: String(variant._id),
                    quantity: nextQuantity,
                  }
                : item
            )
          : [
              ...currentItems,
              {
                product,
                variantId: String(variant._id),
                quantity: Math.min(amount, variant.stock),
              },
            ];

        persistCart(nextItems);
        return nextItems;
      });
    },
    []
  );

  const removeFromCart = useCallback(
    (productId, variantId) => {
      setCartItems((currentItems) => {
        const nextItems = currentItems.filter(
          (item) =>
            !(
              item.product._id === String(productId) &&
              item.variantId === String(variantId)
            )
        );

        persistCart(nextItems);
        return nextItems;
      });
    },
    []
  );

  const updateQuantity = useCallback(
    (productId, variantId, quantity) => {
      const amount = Math.floor(Number(quantity));

      if (!Number.isFinite(amount) || amount < 1) return;

      setCartItems((currentItems) => {
        const nextItems = currentItems
          .map((item) => {
            if (
              item.product._id !== String(productId) ||
              item.variantId !== String(variantId)
            ) {
              return item;
            }

            const stock = getVariantStock(
              item.product,
              item.variantId
            );

            return {
              ...item,
              quantity: Math.min(amount, stock),
            };
          })
          .filter((item) => item.quantity > 0);

        persistCart(nextItems);
        return nextItems;
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    saveCart([]);
  }, [saveCart]);

  const cartCount = useMemo(
    () =>
      getCartItemCount(
        cartItems.map((item) => ({
          quantity: item.quantity,
        }))
      ),
    [cartItems]
  );

  const cartSubtotal = useMemo(
    () =>
      getCartSubtotal(
        cartItems.map((item) => ({
          price: item.product.price,
          quantity: item.quantity,
        }))
      ),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      cartSubtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [
      cartItems,
      cartCount,
      cartSubtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider.");
  }

  return context;
}

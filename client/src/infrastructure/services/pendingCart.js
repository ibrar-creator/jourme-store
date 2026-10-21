const PENDING_CART_KEY = "jourme-pending-cart";
const PENDING_CHECKOUT_KEY = "jourme-pending-checkout";

export function savePendingCart(item) {
  sessionStorage.setItem(PENDING_CART_KEY, JSON.stringify(item));
}

export function getPendingCart() {
  const stored = sessionStorage.getItem(PENDING_CART_KEY);
  if (!stored) return null;

  try {
    const item = JSON.parse(stored);
    if (
      typeof item?.productId === "string" &&
      typeof item?.variantId === "string" &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    ) {
      return item;
    }
  } catch {
    sessionStorage.removeItem(PENDING_CART_KEY);
    return null;
  }

  sessionStorage.removeItem(PENDING_CART_KEY);
  return null;
}

export function clearPendingCart() {
  sessionStorage.removeItem(PENDING_CART_KEY);
}

export function savePendingCheckout() {
  sessionStorage.setItem(PENDING_CHECKOUT_KEY, "true");
}

export function hasPendingCheckout() {
  return sessionStorage.getItem(PENDING_CHECKOUT_KEY) === "true";
}

export function clearPendingCheckout() {
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
}

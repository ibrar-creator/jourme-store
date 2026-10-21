
/**
 * Calculate the total quantity of all items in the cart.
 * Example: [{ quantity: 2 }, { quantity: 3 }] => 5
 */
export function getCartItemCount(cartItems = []) {
  return cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
}

/**
 * Calculate the cart subtotal before shipping and taxes.
 * Example: [{ price: 100, quantity: 2 }] => 200
 */
export function getCartSubtotal(cartItems = []) {
  return cartItems.reduce((total, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;

    return total + price * quantity;
  }, 0);
}

/**
 * Calculate the quantity of a specific product in the cart.
 */
export function getProductQuantity(cartItems = [], productId) {
  const item = cartItems.find(
    (cartItem) => String(cartItem._id) === String(productId)
  );

  return item?.quantity ?? 0;
}

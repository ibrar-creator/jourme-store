import { useEffect } from "react";
import { ArrowRight, ShoppingBag, X } from "lucide-react";

import { useCart } from "../../../application/context/CartContext.jsx";
import CartItem from "./CartItem.jsx";
import Button from "../common/Button.jsx";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { cartItems, cartCount, cartSubtotal, removeFromCart, updateQuantity } =
    useCart();

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close shopping bag"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/40"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-5 sm:px-6">
          <div>
            <h2
              id="cart-drawer-title"
              className="text-lg font-medium tracking-wide"
            >
              Your Bag
            </h2>

            <p className="mt-1 text-xs text-neutral-500">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-neutral-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart contents */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag
                size={32}
                strokeWidth={1.3}
                className="mb-5 text-neutral-400"
              />

              <h3 className="text-base font-medium">Your bag is empty</h3>

              <p className="mt-2 text-sm text-neutral-500">
                Discover your everyday essentials.
              </p>

              <Button variant="secondary" onClick={onClose} className="mt-6">
                Continue Shopping
              </Button>
            </div>
          ) : (
            cartItems.map((item) => (
              <CartItem
                key={`${item.product._id}-${item.variantId}`}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))
          )}
        </div>

        {/* Subtotal and actions */}
        {cartItems.length > 0 && (
          <div className="border-t border-black/10 px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <span className="text-sm">Subtotal</span>

              <span className="text-base font-medium">
                {formatPrice(cartSubtotal)}
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Shipping and applicable taxes are calculated at checkout.
            </p>

            <Button
              size="lg"
              onClick={() => onCheckout?.()}
              className="mt-5 w-full"
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full text-center text-xs underline underline-offset-4"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

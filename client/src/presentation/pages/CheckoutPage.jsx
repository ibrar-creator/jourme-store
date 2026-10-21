
import { useEffect, useState } from "react";
import { LockKeyhole, ShoppingBag } from "lucide-react";

import { useCart } from "../../application/context/CartContext.jsx";
import {
  fetchSellerProfile,
  getAccessToken,
  refreshSellerSession,
} from "../../infrastructure/services/sellerApi.js";
import { httpRequest } from "../../infrastructure/api/httpClient.js";
import {
  clearPendingCheckout,
  savePendingCheckout,
} from "../../infrastructure/services/pendingCart.js";
import MainLayout from "../layouts/MainLayout.jsx";
import Button from "../components/common/Button.jsx";

const initialAddress = {
  fullName: "",
  email: "",
  phone: "",
  addressLine: "",
  city: "",
  postalCode: "",
  country: "Pakistan",
};

function formatPrice(amount) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CheckoutPage() {
  const { cartItems, cartSubtotal, clearCart } = useCart();

  const [authStatus, setAuthStatus] = useState("checking");
  const [authError, setAuthError] = useState("");
  const [address, setAddress] = useState(initialAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function verifyShoppingSession() {
      try {
        let token = getAccessToken();
        if (!token) {
          const session = await refreshSellerSession();
          token = session?.data?.accessToken || "";
        }

        if (!token) {
          const error = new Error("Sign in is required to checkout.");
          error.status = 401;
          throw error;
        }

        const profile = await fetchSellerProfile(token);
        const role = profile?.data?.user?.role;
        if (!["customer", "seller"].includes(role)) {
          const error = new Error("A buyer or seller account is required to checkout.");
          error.status = 403;
          throw error;
        }

        clearPendingCheckout();
        if (!cancelled) setAuthStatus("ready");
      } catch (error) {
        if (cancelled) return;
        if (error.status === 401 || error.status === 403) {
          savePendingCheckout();
          window.dispatchEvent(new CustomEvent("jourme:account"));
          return;
        }
        setAuthError(error.message || "Unable to verify your account.");
        setAuthStatus("error");
      }
    }

    verifyShoppingSession();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setAddress((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (cartItems.length === 0) {
      setError("Your bag is empty. Add a product before checkout.");
      return;
    }

    const invalidItem = cartItems.find((item) => {
      const variant = item.product.variants?.find(
        (entry) => String(entry._id) === String(item.variantId)
      );

      return !variant || !variant.isActive || variant.stock < item.quantity;
    });

    if (invalidItem) {
      setError(
        "A selected size or color is unavailable. Please return to the shop and add the item again."
      );
      return;
    }

    setSubmitting(true);

    try {
      const result = await httpRequest("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: {
          shippingAddress: address,
          items: cartItems.map((item) => ({
            productId: item.product._id,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        },
      });

      if (!result.success) {
        throw new Error(result.message || "Unable to place your order.");
      }

      setOrder(result.data);
      clearCart();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    return (
      <MainLayout>
        <section className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center border border-neutral-200">
            <ShoppingBag size={23} strokeWidth={1.4} />
          </div>

          <p className="mt-7 text-[10px] uppercase tracking-[0.25em] text-neutral-500">
            ORDER RECEIVED
          </p>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] sm:text-5xl">
            Thank you for choosing Jourme.
          </h1>

          <p className="mt-5 text-sm text-neutral-500">
            Your order number is:
          </p>

          <p className="mt-2 font-medium tracking-widest">
            {order.orderNumber}
          </p>

          <p className="mt-4 text-sm text-neutral-500">
            Total: {formatPrice(order.total)}
          </p>

          <p className="mt-3 text-xs text-neutral-500">
            Payment is pending. No payment has been collected by this checkout.
          </p>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("jourme:home"));
            }}
            className="mt-8 bg-black px-6 py-4 text-xs uppercase tracking-widest text-white transition hover:bg-neutral-800"
          >
            Continue shopping
          </button>
        </section>
      </MainLayout>
    );
  }

  if (authStatus !== "ready") {
    return (
      <MainLayout>
        <section className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
          <p role={authStatus === "error" ? "alert" : "status"} className="text-sm text-neutral-600">
            {authStatus === "checking"
              ? "Checking your account..."
              : authError}
          </p>
          {authStatus === "error" && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 border border-neutral-300 px-5 py-3 text-xs uppercase tracking-widest hover:border-neutral-950"
            >
              Try again
            </button>
          )}
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="mx-auto max-w-[1200px] px-5 py-12 sm:px-10 sm:py-20 lg:px-16">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("jourme:home"));
          }}
          className="inline-flex items-center gap-2 text-xs text-neutral-500 transition hover:text-black"
        >
          Continue shopping
        </button>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
              YOUR DETAILS
            </p>

            <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
              Checkout
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Add your contact and delivery details to place your order.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Full name" name="fullName" value={address.fullName} onChange={handleChange} autoComplete="name" />
                <FormField label="Email address" name="email" type="email" value={address.email} onChange={handleChange} autoComplete="email" />
                <FormField label="Phone number" name="phone" type="tel" value={address.phone} onChange={handleChange} autoComplete="tel" />
                <FormField label="Country" name="country" value={address.country} onChange={handleChange} autoComplete="country-name" />

                <div className="sm:col-span-2">
                  <FormField label="Street address" name="addressLine" value={address.addressLine} onChange={handleChange} autoComplete="street-address" />
                </div>

                <FormField label="City" name="city" value={address.city} onChange={handleChange} autoComplete="address-level2" />
                <FormField label="Postal code" name="postalCode" value={address.postalCode} onChange={handleChange} autoComplete="postal-code" />
              </div>

              <Button
                type="submit"
                size="lg"
                loading={submitting}
                disabled={submitting || cartItems.length === 0}
                className="w-full sm:w-auto"
              >
                Place order
              </Button>

              <p className="flex items-center gap-2 text-xs text-neutral-500">
                <LockKeyhole size={14} />
                Your order will be saved securely by the server.
              </p>
            </form>
          </div>

          <aside className="h-fit border border-neutral-200 p-5 sm:p-7">
            <h2 className="text-lg font-medium">Order summary</h2>

            <div className="mt-5 divide-y divide-neutral-200">
              {cartItems.map(({ product, variantId, quantity }) => {
                const variant = product.variants?.find(
                  (entry) => String(entry._id) === String(variantId)
                );

                return (
                  <div
                    key={`${product._id}-${variantId}`}
                    className="flex gap-4 py-4"
                  >
                    <div className="h-20 w-16 shrink-0 bg-neutral-100">
                      {(variant?.image || product.image) && (
                        <img
                          src={variant?.image || product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{product.name}</p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Color: {variant?.color || "Unavailable"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Size: {variant?.size || "Unavailable"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Quantity: {quantity}
                      </p>

                      <p className="mt-2 text-sm">
                        {formatPrice(product.price * quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-between border-t border-neutral-200 pt-5 text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>

            <div className="mt-3 flex justify-between text-sm text-neutral-500">
              <span>Shipping</span>
              <span>Free</span>
            </div>

            <div className="mt-5 flex justify-between border-t border-neutral-200 pt-5 font-medium">
              <span>Total</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </div>

            <p className="mt-4 text-xs leading-5 text-neutral-500">
              Final prices and stock are verified by the server when you place
              your order.
            </p>
          </aside>
        </div>
      </section>
    </MainLayout>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-neutral-600">{label}</span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
        maxLength={name === "email" ? 254 : 200}
        className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
      />
    </label>
  );
}

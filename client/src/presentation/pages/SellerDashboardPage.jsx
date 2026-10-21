import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  CircleAlert,
  Eye,
  EyeOff,
  MapPin,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Store,
  Trash2,
  X,
} from "lucide-react";

import {
  createSellerProduct,
  fetchSellerOrders,
  fetchSellerProducts,
  fetchSellerProfile,
  getAccessToken,
  loginSeller,
  logoutSeller,
  refreshSellerSession,
  registerSeller,
  requestSellerPasswordReset,
  resendSellerVerification,
  resetSellerPassword,
  setSellerProductActive,
  updateSellerProduct,
  verifySellerEmail,
} from "../../infrastructure/services/sellerApi.js";
import {
  getPendingCart,
  hasPendingCheckout,
} from "../../infrastructure/services/pendingCart.js";

const currency = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});
const inputClass =
  "mt-2 w-full border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-950";
const labelClass = "block text-xs font-medium";

function newVariant() {
  return { sku: "", color: "", size: "", stock: "0", image: "", isActive: true };
}

function ProductCreateForm({ token, initialProduct, onCancel, onSaved }) {
  const isEditing = Boolean(initialProduct);
  const [variants, setVariants] = useState(() =>
    initialProduct?.variants?.length
      ? initialProduct.variants.map((variant) => ({
          _id: variant._id,
          sku: variant.sku || "",
          color: variant.color || "",
          size: variant.size || "",
          stock: String(variant.stock ?? 0),
          image: variant.image || "",
          isActive: variant.isActive !== false,
        }))
      : [newVariant()]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function updateVariant(index, field, value) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      )
    );
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const values = new FormData(event.currentTarget);
    const compareAtPriceValue = String(values.get("compareAtPrice") || "").trim();
    const product = {
      name: String(values.get("name") || "").trim(),
      description: String(values.get("description") || "").trim(),
      category: String(values.get("category") || ""),
      price: Number(values.get("price")),
      compareAtPrice: compareAtPriceValue ? Number(compareAtPriceValue) : null,
      sku: String(values.get("sku") || "").trim(),
      image: String(values.get("image") || "").trim(),
      variants: variants.map((variant) => ({
        ...variant,
        stock: Number(variant.stock),
      })),
    };

    try {
      const result = isEditing
        ? await updateSellerProduct(token, initialProduct._id, product)
        : await createSellerProduct(token, product);
      if (!result?.success || !result.data?._id) {
        throw new Error(
          isEditing
            ? "The server did not confirm the product update."
            : "The server did not confirm product creation."
        );
      }
      onSaved(result.data);
    } catch (requestError) {
      setError(
        requestError.message ||
          (isEditing ? "Unable to update the product." : "Unable to create the product.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-8 border border-neutral-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-5 sm:px-7">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            Product details
          </p>
          <h2 className="text-xl font-medium tracking-tight">
            {isEditing ? "Edit product & inventory" : "Create a product"}
          </h2>
          <p className="mt-2 text-xs text-neutral-500">
            {isEditing
              ? "Update product details or adjust stock for each color and size."
              : "Add a product image URL, then enter each color and size as a stock variant."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close product form"
          className="p-2 text-neutral-500 hover:text-neutral-950"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-8 p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Product name
            <input
              name="name"
              defaultValue={initialProduct?.name || ""}
              required
              minLength={2}
              maxLength={150}
              className={inputClass}
              placeholder="e.g. Essential Cotton Shirt"
            />
          </label>
          <label className={labelClass}>
            Category
            <select
              name="category"
              required
              defaultValue={initialProduct?.category || ""}
              className={inputClass}
            >
              <option value="" disabled>Select a category</option>
              <option value="Clothing">Clothing</option>
              <option value="Accessories">Accessories</option>
              <option value="Footwear">Footwear</option>
            </select>
          </label>
          <label className={labelClass}>
            Product SKU
            <input
              name="sku"
              defaultValue={initialProduct?.sku || ""}
              required
              minLength={2}
              maxLength={50}
              pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,49}"
              title="2-50 letters, numbers, hyphens, or underscores"
              className={inputClass}
              placeholder="e.g. JRM-SHR-001"
            />
          </label>
          <label className={labelClass}>
            Product image URL
            <input
              name="image"
              defaultValue={initialProduct?.image || ""}
              type="url"
              required
              maxLength={2048}
              className={inputClass}
              placeholder="https://example.com/product.jpg"
            />
          </label>
          <label className={labelClass}>
            Price (PKR)
            <input
              name="price"
              defaultValue={initialProduct?.price ?? ""}
              type="number"
              required
              min="0"
              step="0.01"
              className={inputClass}
              placeholder="3490"
            />
          </label>
          <label className={labelClass}>
            Compare-at price (PKR, optional)
            <input
              name="compareAtPrice"
              defaultValue={initialProduct?.compareAtPrice ?? ""}
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              placeholder="4290"
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Description
            <textarea
              name="description"
              defaultValue={initialProduct?.description || ""}
              required
              maxLength={3000}
              rows={4}
              className={inputClass}
              placeholder="Describe the product, its materials, fit, and key details."
            />
          </label>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium">Sizes, colors & stock</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Each variant needs a unique SKU, color, size, and whole-number stock quantity.
              </p>
            </div>
            <button
              type="button"
              disabled={variants.length >= 100}
              onClick={() => setVariants((current) => [...current, newVariant()])}
              className="inline-flex items-center gap-2 border border-neutral-300 px-3 py-2 text-[10px] uppercase tracking-widest hover:border-neutral-950 disabled:opacity-40"
            >
              <Plus size={14} />
              Add variant
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <fieldset
                key={variant._id || `new-${index}`}
                className="grid gap-3 border border-neutral-200 p-4 sm:grid-cols-2 lg:grid-cols-5"
              >
                <legend className="px-2 text-[10px] uppercase tracking-widest text-neutral-500">
                  Variant {index + 1}
                </legend>
                <label className={labelClass}>
                  Variant SKU
                  <input
                    required
                    minLength={2}
                    maxLength={50}
                    pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,49}"
                    title="2-50 letters, numbers, hyphens, or underscores"
                    value={variant.sku}
                    onChange={(event) => updateVariant(index, "sku", event.target.value)}
                    className={inputClass}
                    placeholder="JRM-SHR-WHT-M"
                  />
                </label>
                <label className={labelClass}>
                  Color
                  <input
                    required
                    maxLength={50}
                    value={variant.color}
                    onChange={(event) => updateVariant(index, "color", event.target.value)}
                    className={inputClass}
                    placeholder="White"
                  />
                </label>
                <label className={labelClass}>
                  Size
                  <input
                    required
                    maxLength={30}
                    value={variant.size}
                    onChange={(event) => updateVariant(index, "size", event.target.value)}
                    className={inputClass}
                    placeholder="M"
                  />
                </label>
                <label className={labelClass}>
                  Stock quantity
                  <input
                    required
                    type="number"
                    min="0"
                    max="1000000"
                    step="1"
                    value={variant.stock}
                    onChange={(event) => updateVariant(index, "stock", event.target.value)}
                    className={inputClass}
                  />
                </label>
                <div className="flex items-end gap-2">
                  <label className={`${labelClass} min-w-0 flex-1`}>
                    Variant image URL (optional)
                    <input
                      type="url"
                      maxLength={2048}
                      value={variant.image}
                      onChange={(event) => updateVariant(index, "image", event.target.value)}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </label>
                  <button
                    type="button"
                    disabled={variants.length === 1}
                    onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    aria-label={`Remove variant ${index + 1}`}
                    className="mb-0.5 border border-neutral-200 p-3 text-neutral-500 hover:border-red-300 hover:text-red-700 disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="border border-neutral-300 px-5 py-3 text-xs uppercase tracking-widest hover:border-neutral-950"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 bg-neutral-950 px-5 py-3 text-xs uppercase tracking-widest text-white hover:bg-neutral-700 disabled:cursor-wait disabled:opacity-60"
          >
            <Plus size={15} />
            {busy
              ? isEditing ? "Saving..." : "Creating..."
              : isEditing ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </section>
  );
}

function AuthForm({
  onAuthenticated,
  notice,
  resetToken = "",
  role = "seller",
}) {
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [formRole, setFormRole] = useState(role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(notice || "");
  const [email, setEmail] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const values = new FormData(event.currentTarget);
    const submittedEmail = String(values.get("email") || email).trim();
    const credentials = {
      email: submittedEmail,
      password: String(values.get("password") || ""),
    };

    try {
      if (mode === "register") {
        const result = await registerSeller({
          ...credentials,
          name: String(values.get("name") || "").trim(),
          storeName: String(values.get("storeName") || "").trim(),
          role: formRole,
        });
        setMessage(result.message);
        setMode("login");
        setEmail(submittedEmail);
        return;
      }

      if (mode === "forgot") {
        const result = await requestSellerPasswordReset(submittedEmail);
        setMessage(result.message);
        setMode("login");
        setEmail(submittedEmail);
        return;
      }

      if (mode === "reset") {
        const result = await resetSellerPassword(
          resetToken,
          credentials.password
        );
        setMessage(result.message);
        setMode("login");
        return;
      }

      const result = await loginSeller(credentials);

      if (!result?.success || !result.data?.accessToken) {
        throw new Error("Authentication response was incomplete.");
      }

      if (result.data.user.role !== formRole) {
        await logoutSeller();
        throw new Error(`This account does not have ${formRole} portal access.`);
      }
      setMessage("");
      if (
        formRole !== role &&
        !getPendingCart() &&
        !hasPendingCheckout()
      ) {
        window.dispatchEvent(
          new CustomEvent(formRole === "seller" ? "jourme:seller" : "jourme:account")
        );
      }
      onAuthenticated(result.data.accessToken);
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in right now.");
      setShowResendVerification(
        requestError.status === 403 &&
          requestError.message.toLowerCase().includes("verify your email")
      );
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setBusy(true);
    setError("");
    try {
      const result = await resendSellerVerification(email);
      setMessage(result.message);
      setShowResendVerification(false);
    } catch (requestError) {
      setError(requestError.message || "Unable to send a verification email.");
    } finally {
      setBusy(false);
    }
  }

  const isRegister = mode === "register";
  const isReset = mode === "reset";
  const asksEmail = mode === "login" || mode === "register" || mode === "forgot";
  const visibleRole = formRole;

  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-neutral-50 px-5 py-12">
      <div className="w-full max-w-md border border-neutral-200 bg-white p-7 sm:p-10">
        <div className="mb-8 flex h-12 w-12 items-center justify-center bg-neutral-950 text-white">
          <Store size={21} />
        </div>
        <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
          Jourme {visibleRole === "customer" ? "buyer" : visibleRole} portal
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.05em]">
          {mode === "login"
            ? "Welcome back."
            : mode === "register"
              ? `Create your ${formRole === "customer" ? "buyer" : formRole} account.`
              : mode === "forgot"
                ? "Reset your password."
                : "Choose a new password."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          {mode === "login"
            ? formRole === "seller"
              ? "Sign in to check your products and inventory."
              : formRole === "customer"
                ? "Sign in to manage your Jourme account."
                : "Sign in to the administrator portal."
            : mode === "register"
              ? formRole === "customer"
                ? "Create an account to get started with Jourme."
                : "Register to start managing your Jourme store."
              : mode === "forgot"
                ? "We’ll email a reset link if an account matches."
                : "Your new password must be at least 8 characters."}
        </p>
        {(notice || message) && (
          <p role="status" className="mt-4 text-sm text-amber-800">
            {message || notice}
          </p>
        )}

        <form onSubmit={submit} className="mt-8 space-y-5">
          {(isRegister || mode === "login") && role !== "admin" && (
            <label className="block text-xs font-medium">
              {isRegister ? "I am registering as" : "I am signing in as"}
              <select
                name="role"
                value={formRole}
                onChange={(event) => {
                  setFormRole(event.target.value);
                  setError("");
                }}
                className="mt-2 w-full border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-950"
              >
                <option value="customer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </label>
          )}
          {isRegister && role !== "admin" && (
            <label className="block text-xs font-medium">
              Full name
              <input
                name="name"
                type="text"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
                className="mt-2 w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
              />
            </label>
          )}
          {isRegister && formRole === "seller" && (
            <label className="block text-xs font-medium">
              Store name
              <input
                name="storeName"
                type="text"
                autoComplete="organization"
                minLength={2}
                maxLength={80}
                required
                className="mt-2 w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
              />
            </label>
          )}
          {asksEmail && (
            <label className="block text-xs font-medium">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
              />
            </label>
          )}
          {isReset && (
            <label className="block text-xs font-medium">
              New password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                className="mt-2 w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
              />
            </label>
          )}
          {!isReset && mode !== "forgot" && (
          <label className="block text-xs font-medium">
            Password
            <input
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? 8 : undefined}
              maxLength={72}
              required
              className="mt-2 w-full border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-950"
            />
          </label>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-neutral-950 px-5 py-3.5 text-xs font-medium uppercase tracking-[0.15em] text-white transition hover:bg-neutral-700 disabled:cursor-wait disabled:opacity-60"
          >
            {busy
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? `Create ${formRole === "customer" ? "buyer" : formRole} account`
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Reset password"}
          </button>
        </form>

        {showResendVerification && mode === "login" && (
          <button
            type="button"
            disabled={busy || !email}
            onClick={resendVerification}
            className="mt-5 w-full text-center text-sm underline underline-offset-4 disabled:opacity-50"
          >
            Resend verification email
          </button>
        )}

        {mode === "login" && (
          <div className="mt-5 flex flex-col items-center gap-3 text-sm text-neutral-600">
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError("");
                setMessage("");
              }}
              className="underline underline-offset-4"
            >
              Forgot password?
            </button>
            {role !== "admin" && (
              <p>
                New to Jourme?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setFormRole(role);
                    setMode("register");
                    setError("");
                    setMessage("");
                  }}
                  className="font-medium text-neutral-950 underline underline-offset-4"
                >
                  Create a {role} account
                </button>
              </p>
            )}
          </div>
        )}
        {mode !== "login" && (
          <p className="mt-6 text-center text-sm text-neutral-600">
            {mode === "reset" ? "Back to sign in?" : "Remembered your password?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className="font-medium text-neutral-950 underline underline-offset-4"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </main>
  );
}

function VerifyEmailScreen({ token, onDone }) {
  const [status, setStatus] = useState({
    loading: true,
    message: "Verifying your email...",
    error: false,
  });

  useEffect(() => {
    async function verify() {
      try {
        const result = await verifySellerEmail(token);
        setStatus({
          loading: false,
          message: result.message,
          error: false,
        });
      } catch (error) {
        setStatus({
          loading: false,
          message: error.message || "This verification link is invalid or expired.",
          error: true,
        });
      }
    }

    verify();
  }, [token]);

  return (
    <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-neutral-50 px-5 py-12">
      <section className="w-full max-w-md border border-neutral-200 bg-white p-7 sm:p-10">
        <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
          Jourme seller portal
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.05em]">Email verification</h1>
        <p
          role={status.error ? "alert" : "status"}
          className={`mt-4 text-sm leading-6 ${status.error ? "text-red-700" : "text-neutral-600"}`}
        >
          {status.message}
        </p>
        {!status.loading && (
          <button
            type="button"
            onClick={onDone}
            className="mt-7 w-full bg-neutral-950 px-5 py-3.5 text-xs uppercase tracking-[0.15em] text-white hover:bg-neutral-700"
          >
            Continue to sign in
          </button>
        )}
      </section>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <p className="text-[10px] uppercase tracking-[0.17em] text-neutral-500">
          {label}
        </p>
        <Icon size={18} strokeWidth={1.5} className="text-neutral-500" />
      </div>
      <p className="mt-6 text-3xl font-medium tracking-[-0.05em]">{value}</p>
      <p className="mt-2 text-xs text-neutral-500">{detail}</p>
    </article>
  );
}

function ProductInventory({
  products,
  loading,
  error,
  onRetry,
  onEdit,
  onToggleActive,
  busyProductId,
}) {
  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-neutral-500">
        <RefreshCw size={16} className="animate-spin" />
        Loading your inventory...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-4 p-6">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="border border-neutral-300 px-4 py-2 text-xs uppercase tracking-widest hover:border-neutral-950"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
        <Package size={28} strokeWidth={1.3} className="text-neutral-400" />
        <h3 className="mt-5 text-lg font-medium">Your product list is empty</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
          Products you add to your seller account will appear here with their
          current stock levels.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead>
          <tr className="border-y border-neutral-200 text-[10px] uppercase tracking-[0.15em] text-neutral-500">
            <th className="px-5 py-4 font-medium">Product</th>
            <th className="px-5 py-4 font-medium">SKU</th>
            <th className="px-5 py-4 font-medium">Price</th>
            <th className="px-5 py-4 font-medium">Inventory</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const stock = Number(product.stock) || 0;
            const status = product.isActive === false ? "Inactive" : "Active";
            return (
              <tr key={product._id} className="border-b border-neutral-100">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-12 shrink-0 bg-neutral-100">
                      {product.image && (
                        <img
                          src={product.image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="max-w-56 truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {product.category}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-neutral-600">{product.sku || "—"}</td>
                <td className="px-5 py-4 text-sm">{currency.format(Number(product.price) || 0)}</td>
                <td className="px-5 py-4">
                  <span className={`text-sm ${stock <= 5 && status === "Active" ? "font-medium text-amber-700" : ""}`}>
                    {stock} units
                  </span>
                  {stock <= 5 && status === "Active" && (
                    <span className="mt-1 block text-[10px] uppercase tracking-widest text-amber-700">
                      Low stock
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-2 text-xs ${status === "Active" ? "text-emerald-800" : "text-neutral-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status === "Active" ? "bg-emerald-600" : "bg-neutral-400"}`} />
                    {status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={Boolean(busyProductId)}
                      onClick={() => onEdit(product)}
                      aria-label={`Edit ${product.name} and inventory`}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-700 hover:text-neutral-950 disabled:opacity-40"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(busyProductId)}
                      onClick={() => onToggleActive(product)}
                      aria-label={`${status === "Active" ? "Deactivate" : "Activate"} ${product.name}`}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-700 hover:text-neutral-950 disabled:opacity-40"
                    >
                      {busyProductId === product._id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : status === "Active" ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                      {status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function SellerDashboardPage({ accountRole = "seller" }) {
  const [token, setToken] = useState(() => getAccessToken());
  const [authInitialized, setAuthInitialized] = useState(
    () => Boolean(getAccessToken())
  );
  const [authNotice, setAuthNotice] = useState("");
  const [emailLink, setEmailLink] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const verify = params.get("verify");
    const reset = params.get("reset");
    return verify
      ? { type: "verify", token: verify }
      : reset
        ? { type: "reset", token: reset }
        : null;
  });
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [ordersResult, setOrdersResult] = useState({
    key: "",
    orders: [],
    error: "",
  });
  const orderRequestKey =
    token && accountRole === "seller" ? `${token}:${refreshVersion}` : "";
  const ordersLoading = Boolean(
    orderRequestKey && ordersResult.key !== orderRequestKey
  );
  const orders =
    ordersResult.key === orderRequestKey ? ordersResult.orders : [];
  const ordersError =
    ordersResult.key === orderRequestKey ? ordersResult.error : "";
  const [summary, setSummary] = useState({
    activeProducts: 0,
    inactiveProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [busyProductId, setBusyProductId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    if (emailLink) {
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${window.location.hash}`
      );
    }
  }, [emailLink]);

  useEffect(() => {
    if (token || authInitialized) return undefined;

    let cancelled = false;
    async function restoreSession() {
      try {
        const result = await refreshSellerSession();
        if (cancelled) return;
        if (result?.data?.user?.role === accountRole && result.data.accessToken) {
          setToken(result.data.accessToken);
        } else if (
          result?.data?.accessToken &&
          ["customer", "seller"].includes(result?.data?.user?.role) &&
          (getPendingCart() || hasPendingCheckout())
        ) {
          setToken(result.data.accessToken);
          const pendingCart = getPendingCart();
          if (pendingCart) {
            window.dispatchEvent(
              new CustomEvent("jourme:resume-cart", {
                detail: { productId: pendingCart.productId },
              })
            );
          } else {
            window.dispatchEvent(new CustomEvent("jourme:checkout"));
          }
        } else {
          await logoutSeller();
          setAuthNotice(`This account does not have ${accountRole} portal access.`);
        }
      } catch (error) {
        if (!cancelled && error.status !== 401) {
          setAuthNotice(error.message || "Could not restore your seller session.");
        }
      } finally {
        if (!cancelled) {
          setAuthInitialized(true);
          if (!getAccessToken()) setLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [token, authInitialized, accountRole]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const profileResult = await fetchSellerProfile(token, {
          signal: controller.signal,
        });
        if (!profileResult?.success) {
          throw new Error("Unable to load your seller dashboard.");
        }
        if (profileResult.data.user.role !== accountRole) {
          const pendingCart = getPendingCart();
          if (
            pendingCart &&
            ["customer", "seller"].includes(profileResult.data.user.role)
          ) {
            window.dispatchEvent(
              new CustomEvent("jourme:resume-cart", {
                detail: { productId: pendingCart.productId },
              })
            );
            return;
          }
          if (
            hasPendingCheckout() &&
            ["customer", "seller"].includes(profileResult.data.user.role)
          ) {
            window.dispatchEvent(new CustomEvent("jourme:checkout"));
            return;
          }
          await logoutSeller();
          setAuthNotice(`This account does not have ${accountRole} portal access.`);
          setAuthInitialized(true);
          setToken("");
          return;
        }

        setSeller(profileResult.data.user);
        if (accountRole === "seller") {
          const productsResult = await fetchSellerProducts(token, {
            page,
            signal: controller.signal,
          });
          if (!productsResult?.success) {
            throw new Error("Unable to load your seller inventory.");
          }
          setProducts(productsResult.data || []);
          setSummary(productsResult.summary || {
            activeProducts: 0,
            inactiveProducts: 0,
            totalStock: 0,
            lowStockProducts: 0,
          });
          setPagination(productsResult.pagination || { total: 0, totalPages: 0 });
        }
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          if (requestError.status === 401) {
            setAuthNotice("Your session expired. Please sign in again.");
            setAuthInitialized(true);
            setToken("");
          }
          setError(requestError.message || "Unable to load your dashboard.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, [token, page, refreshVersion, accountRole]);

  useEffect(() => {
    if (!orderRequestKey) return undefined;

    const controller = new AbortController();

    fetchSellerOrders(token, { signal: controller.signal })
      .then((result) => {
        if (!result?.success) {
          throw new Error("Unable to load your orders.");
        }
        setOrdersResult({
          key: orderRequestKey,
          orders: result.data || [],
          error: "",
        });
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setOrdersResult({
            key: orderRequestKey,
            orders: [],
            error: requestError.message || "Unable to load your orders.",
          });
        }
      });

    return () => controller.abort();
  }, [token, orderRequestKey]);

  function authenticate(nextToken) {
    setEmailLink(null);
    setAuthNotice("");
    setAuthInitialized(true);
    setError("");
    setLoading(true);
    setToken(nextToken);
    setPage(1);
    const pendingCart = getPendingCart();
    if (pendingCart) {
      window.dispatchEvent(
        new CustomEvent("jourme:resume-cart", {
          detail: { productId: pendingCart.productId },
        })
      );
    } else if (hasPendingCheckout()) {
      window.dispatchEvent(new CustomEvent("jourme:checkout"));
    }
  }

  function signOut() {
    logoutSeller().catch((logoutError) => {
      setError(logoutError.message || "Unable to revoke the server session.");
    });
    setToken("");
    setAuthInitialized(true);
    setSeller(null);
    setError("");
    setLoading(false);
  }

  function refreshDashboard() {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    setRefreshVersion((current) => current + 1);
  }

  function handleProductSaved(product) {
    const wasEditing = Boolean(editingProduct);
    setEditingProduct(null);
    setCreateOpen(false);
    setSuccessMessage(
      wasEditing
        ? `${product.name} was updated.`
        : `${product.name} was added to your products.`
    );
    setError("");
    setLoading(true);
    setPage(1);
    setRefreshVersion((current) => current + 1);
  }

  async function toggleProductActive(product) {
    const isActive = product.isActive === false;
    setBusyProductId(product._id);
    setError("");
    setSuccessMessage("");

    try {
      const result = await setSellerProductActive(token, product._id, isActive);
      if (!result?.success || !result.data?._id) {
        throw new Error("The server did not confirm the product status change.");
      }

      setSuccessMessage(
        isActive
          ? `${product.name} is active again.`
          : `${product.name} was deactivated.`
      );
      setLoading(true);
      setRefreshVersion((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || "Unable to update the product status.");
    } finally {
      setBusyProductId("");
    }
  }

  function openProductEditor(product) {
    setCreateOpen(false);
    setSuccessMessage("");
    setEditingProduct(product);
  }

  function changePage(nextPage) {
    setError("");
    setLoading(true);
    setPage(nextPage);
  }

  if (emailLink?.type === "verify") {
    return (
      <VerifyEmailScreen
        token={emailLink.token}
        onDone={() => setEmailLink(null)}
      />
    );
  }

  if (emailLink?.type === "reset") {
    return (
      <AuthForm
        onAuthenticated={authenticate}
        notice={authNotice}
        resetToken={emailLink.token}
      />
    );
  }

  if (!token) {
    if (!authInitialized || loading) {
      return (
        <main className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-neutral-50 text-sm text-neutral-500">
          Restoring your seller session...
        </main>
      );
    }
    return (
      <AuthForm
        onAuthenticated={authenticate}
        notice={authNotice || error}
        resetToken={emailLink?.type === "reset" ? emailLink.token : ""}
        role={accountRole}
      />
    );
  }

  if (accountRole !== "seller") {
    return (
      <main className="min-h-[calc(100vh-76px)] bg-neutral-50">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-10 sm:py-14">
          <div className="mb-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("jourme:home"))}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-neutral-600 hover:text-neutral-950"
            >
              <ArrowLeft size={15} />
              Back to store
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-neutral-600 hover:text-neutral-950"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
          <section className="border border-neutral-200 bg-white p-7 sm:p-10">
            <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
              Jourme {accountRole} portal
            </p>
            <h1 className="text-4xl font-medium tracking-[-0.06em]">
              {accountRole === "admin" ? "Administrator access." : `Welcome, ${seller?.name || "back"}.`}
            </h1>
            <p className="mt-4 text-sm text-neutral-500">{seller?.email}</p>
            {accountRole === "customer" ? (
              <p className="mt-6 text-sm leading-6 text-neutral-600">
                Your customer account is active. Continue shopping and sign out
                securely from here.
              </p>
            ) : (
              <p className="mt-6 text-sm leading-6 text-neutral-600">
                You are signed in with administrator permissions. Admin
                accounts must be provisioned by an operator.
              </p>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-76px)] bg-neutral-50">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-10 sm:py-12 lg:px-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("jourme:home"))}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-neutral-600 hover:text-neutral-950"
          >
            <ArrowLeft size={15} />
            Back to store
          </button>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-neutral-600 hover:text-neutral-950"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>

        <header className="mb-9 border-b border-neutral-200 pb-8">
          <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
            Seller dashboard
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-medium tracking-[-0.06em] sm:text-5xl">
                {seller?.storeName || (seller ? `Hello, ${seller.name.split(" ")[0]}.` : "Your store.")}
              </h1>
              <p className="mt-3 text-sm text-neutral-500">
                Manage your products, prices, stock, and customer orders.
              </p>
            </div>
            {seller && (
              <p className="text-xs text-neutral-500">{seller.email}</p>
            )}
          </div>
        </header>

        {error && !loading && seller && (
          <div role="alert" className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {successMessage && (
          <div role="status" className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}

        {(createOpen || editingProduct) && (
          <ProductCreateForm
            key={editingProduct?._id || "new-product"}
            token={token}
            initialProduct={editingProduct}
            onCancel={() => {
              setCreateOpen(false);
              setEditingProduct(null);
            }}
            onSaved={handleProductSaved}
          />
        )}

        <section aria-label="Store summary" className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            icon={Package}
            label="Active products"
            value={summary.activeProducts}
            detail={`${summary.inactiveProducts} inactive`}
          />
          <MetricCard
            icon={Boxes}
            label="Units in inventory"
            value={summary.totalStock}
            detail="Across all of your products"
          />
          <MetricCard
            icon={CircleAlert}
            label="Low stock"
            value={summary.lowStockProducts}
            detail="Active products with 5 units or fewer"
          />
        </section>

        <section className="border border-neutral-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-medium tracking-tight">Products & inventory</h2>
              <p className="mt-1 text-xs text-neutral-500">
                {pagination.total} {pagination.total === 1 ? "product" : "products"} in your store
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={refreshDashboard}
                aria-label="Refresh products"
                className="inline-flex items-center gap-2 border border-neutral-200 px-3 py-2 text-[10px] uppercase tracking-widest hover:border-neutral-950"
              >
                <RefreshCw size={13} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage("");
                  setEditingProduct(null);
                  setCreateOpen((current) => !current);
                }}
                className="inline-flex items-center gap-2 bg-neutral-950 px-3 py-2 text-[10px] uppercase tracking-widest text-white hover:bg-neutral-700"
              >
                <Plus size={14} />
                Add product
              </button>
            </div>
          </div>

          <ProductInventory
            products={products}
            loading={loading}
            error={error && !seller ? error : ""}
            onRetry={refreshDashboard}
            onEdit={openProductEditor}
            onToggleActive={toggleProductActive}
            busyProductId={busyProductId}
          />

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-xs">
              <span className="text-neutral-500">
                Page {page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => changePage(page - 1)}
                  className="border border-neutral-300 px-3 py-2 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => changePage(page + 1)}
                  className="border border-neutral-300 px-3 py-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10 border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-medium tracking-tight">Customer orders</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Orders containing products from {seller?.storeName || "your store"}
            </p>
          </div>
          {ordersLoading ? (
            <div className="flex min-h-32 items-center justify-center gap-3 text-sm text-neutral-500">
              <RefreshCw size={16} className="animate-spin" />
              Loading your orders...
            </div>
          ) : ordersError ? (
            <p role="alert" className="px-6 py-8 text-sm text-red-700">{ordersError}</p>
          ) : orders.length === 0 ? (
            <p className="px-6 py-8 text-sm text-neutral-500">No orders for your products yet.</p>
          ) : (
            <div className="divide-y divide-neutral-200">
              {orders.map((order) => (
                <article key={order.orderNumber} className="space-y-4 px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium">{order.orderNumber}</h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="capitalize">{order.status}</p>
                      <p className="mt-1 text-neutral-500">
                        {order.paymentStatus} · {currency.format(order.subtotal)}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {order.items.map((item) => (
                      <li key={`${item.product}-${item.variantId}`} className="flex justify-between gap-4">
                        <span>{item.name} · {item.color}, {item.size} × {item.quantity}</span>
                        <span className="shrink-0">{currency.format(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="flex items-start gap-2 text-xs leading-5 text-neutral-500">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    {order.shippingAddress.fullName}, {order.shippingAddress.phone},{" "}
                    {order.shippingAddress.addressLine}, {order.shippingAddress.city},{" "}
                    {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

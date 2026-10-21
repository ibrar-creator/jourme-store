
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";

import { fetchProductById } from "../../infrastructure/services/productApi.js";
import {
  getShoppingUser,
} from "../../infrastructure/services/sellerApi.js";
import {
  clearPendingCart,
  getPendingCart,
  savePendingCart,
} from "../../infrastructure/services/pendingCart.js";
import { useCart } from "../../application/context/CartContext.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import Button from "../components/common/Button.jsx";

function formatPrice(price) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ProductDetailPage({ productId }) {
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState(
    productId ? "" : "Product ID is missing."
  );
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);

      try {
        const result = await fetchProductById(productId, {
          signal: controller.signal,
        });

        if (!result?.success || !result.data) {
          throw new Error("Unable to load this product.");
        }

        const item = result.data;
        setProduct(item);

        const variants = Array.isArray(item.variants)
          ? item.variants.filter((variant) => variant.isActive)
          : [];

        const firstAvailable = variants.find(
          (variant) => variant.stock > 0
        );

        const firstVariant = firstAvailable || variants[0];

        if (firstVariant) {
          setSelectedColor(firstVariant.color);
          setSelectedSize(firstVariant.size);
        }

        setQuantity(1);

        const pendingCart = getPendingCart();
        if (pendingCart?.productId === String(item._id)) {
          const pendingVariant = item.variants?.find(
            (variant) =>
              String(variant._id) === pendingCart.variantId &&
              variant.isActive &&
              variant.stock >= pendingCart.quantity
          );

          try {
            if (!pendingVariant) {
              throw new Error(
                "That selection is no longer available. Choose an available option and try again."
              );
            }

            const shoppingUser = await getShoppingUser();
            if (!shoppingUser) {
              savePendingCart(pendingCart);
              window.dispatchEvent(new CustomEvent("jourme:account"));
              return;
            }

            addToCart(item, pendingVariant._id, pendingCart.quantity);
            clearPendingCart();
            window.dispatchEvent(new CustomEvent("jourme:open-cart"));
          } catch (cartRequestError) {
            clearPendingCart();
            setCartError(cartRequestError.message);
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load this product.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (productId) {
      loadProduct();
    }

    return () => controller.abort();
  }, [productId, addToCart]);

  const activeVariants = (product?.variants || []).filter(
    (variant) => variant.isActive
  );

  const colors = [
    ...new Set(activeVariants.map((variant) => variant.color)),
  ];

 
const sizes = [
  ...new Set(
    activeVariants
      .filter((variant) => variant.color === selectedColor)
      .map((variant) => variant.size)
  ),
];


  const selectedVariant = activeVariants.find(
    (variant) =>
      variant.color === selectedColor &&
      variant.size === selectedSize
  );

  const stock = selectedVariant?.stock ?? 0;
  const selectedQuantity =
    stock > 0 ? Math.min(quantity, stock) : quantity;
  const image =
    selectedVariant?.image ||
    product?.image ||
    "";

  function chooseColor(color) {
    setSelectedColor(color);

    const variantsForColor = activeVariants.filter(
      (variant) => variant.color === color
    );

    const availableVariant = variantsForColor.find(
      (variant) => variant.stock > 0
    );

    const nextVariant = availableVariant || variantsForColor[0];

    setSelectedSize(nextVariant?.size || "");
    setQuantity(1);
  }

  function chooseSize(size) {
    setSelectedSize(size);
    setQuantity(1);
  }

  async function handleAddToBag() {
    if (!product || !selectedVariant || stock < 1) return;

    setCartError("");
    setAdding(true);
    try {
      const shoppingUser = await getShoppingUser();
      if (shoppingUser) {
        addToCart(product, selectedVariant._id, selectedQuantity);
        window.dispatchEvent(new CustomEvent("jourme:open-cart"));
        return;
      }

      savePendingCart({
        productId: String(product._id),
        variantId: String(selectedVariant._id),
        quantity: selectedQuantity,
      });
      window.dispatchEvent(new CustomEvent("jourme:account"));
    } catch (err) {
      setCartError(err.message || "Unable to add this product.");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="mx-auto min-h-[60vh] max-w-7xl px-6 py-24">
          <p className="text-sm text-neutral-500">
            Loading product...
          </p>
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <section className="mx-auto min-h-[60vh] max-w-7xl px-6 py-20">
          <p className="mb-6 text-sm text-red-600">
            {error || "Product not found."}
          </p>

          <Button
            variant="secondary"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("jourme:home"))
            }
          >
            <ArrowLeft size={16} />
            Back to Shop
          </Button>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("jourme:home"))
          }
          className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-neutral-600 transition hover:text-black"
        >
          <ArrowLeft size={15} />
          Back to Shop
        </button>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          <div className="overflow-hidden bg-neutral-100">
            <img
              src={image}
              alt={product.name}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>

          <section className="flex flex-col py-1 md:py-6">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">
              {product.category}
            </p>
            {product.sellerStoreName && (
              <p className="mb-2 text-xs text-neutral-500">
                Sold by {product.sellerStoreName}
              </p>
            )}

            <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-5 text-lg">
              {formatPrice(product.price)}
            </p>

            {product.compareAtPrice > product.price && (
              <p className="mt-1 text-sm text-neutral-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </p>
            )}

            <p className="mt-7 whitespace-pre-line text-sm leading-7 text-neutral-600">
              {product.description || "Designed for everyday use."}
            </p>

            {activeVariants.length > 0 ? (
              <>
                <div className="mt-9">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.15em]">
                      Color
                    </span>
                    <span className="text-xs text-neutral-500">
                      {selectedColor}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => chooseColor(color)}
                        aria-pressed={selectedColor === color}
                        className={`border px-4 py-2 text-xs transition ${
                          selectedColor === color
                            ? "border-black bg-black text-white"
                            : "border-neutral-300 hover:border-black"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-7">
                  <span className="mb-3 block text-xs uppercase tracking-[0.15em]">
                    Size
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const variant = activeVariants.find(
                        (item) =>
                          item.color === selectedColor &&
                          item.size === size
                      );

                      const unavailable = !variant || variant.stock < 1;

                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={unavailable}
                          onClick={() => chooseSize(size)}
                          aria-pressed={selectedSize === size}
                          aria-label={`${size}${unavailable ? ", unavailable in " + selectedColor : ""}`}
                          className={`min-w-12 border px-4 py-3 text-xs transition ${
                            selectedSize === size
                              ? "border-black bg-black text-white"
                              : "border-neutral-300 hover:border-black"
                          } disabled:cursor-not-allowed disabled:opacity-30`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="mt-5 text-xs text-neutral-500">
                  {!selectedVariant
                    ? "Select an available color and size."
                    : stock < 1
                      ? "Out of stock"
                      : stock <= 3
                        ? `Only ${stock} left`
                        : "In stock"}
                </p>
                {cartError && (
                  <p role="alert" className="mt-4 text-sm text-red-700">
                    {cartError}
                  </p>
                )}

                <div className="mt-7 flex items-center gap-5">
                  <span className="text-xs uppercase tracking-[0.15em]">
                    Quantity
                  </span>

                  <div className="flex items-center border border-neutral-300">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={selectedQuantity <= 1}
                      onClick={() => setQuantity(Math.max(1, selectedQuantity - 1))}
                      className="p-3 disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="min-w-8 text-center text-sm">
                      {selectedQuantity}
                    </span>

                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={selectedQuantity >= stock}
                      onClick={() =>
                        setQuantity(Math.min(stock, selectedQuantity + 1))
                      }
                      className="p-3 disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={!selectedVariant || stock < 1 || adding}
                  onClick={handleAddToBag}
                  className="mt-8 w-full"
                >
                  <ShoppingBag size={17} />
                  {stock < 1 ? "Out of Stock" : "Add to Bag"}
                </Button>
              </>
            ) : (
              <p className="mt-8 text-sm text-neutral-500">
                No product variants are currently available.
              </p>
            )}
          </section>
        </div>
      </main>
    </MainLayout>
  );
}

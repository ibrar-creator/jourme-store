
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import Button from "../common/Button.jsx";

export default function ProductCard({ product }) {
  const isOutOfStock =
    Array.isArray(product.variants) && product.variants.length > 0
      ? !product.variants.some(
          (variant) => variant.isActive && variant.stock > 0
        )
      : product.stock < 1;

  const formattedPrice = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(product.price);

  const formattedComparePrice =
    product.compareAtPrice != null &&
    product.compareAtPrice > product.price
      ? new Intl.NumberFormat("en-PK", {
          style: "currency",
          currency: "PKR",
          maximumFractionDigits: 0,
        }).format(product.compareAtPrice)
      : null;

  function openProduct() {
    window.dispatchEvent(
      new CustomEvent("jourme:product", {
        detail: { productId: product._id },
      })
    );
  }

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            Image unavailable
          </div>
        )}

        {product.isFeatured && (
          <span className="absolute left-3 top-3 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.15em]">
            Featured
          </span>
        )}

        <button
          type="button"
          aria-label={`View ${product.name}`}
          onClick={openProduct}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center bg-white text-black opacity-0 transition-opacity hover:bg-black hover:text-white focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100"
        >
          <ArrowUpRight size={18} />
        </button>
      </div>

      <div className="space-y-2 pt-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          {product.category}
        </p>
        {product.sellerStoreName && (
          <p className="text-[10px] text-neutral-500">
            Sold by {product.sellerStoreName}
          </p>
        )}

        <button
          type="button"
          onClick={openProduct}
          className="text-left text-sm font-medium tracking-wide transition hover:text-neutral-500 sm:text-base"
        >
          {product.name}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">{formattedPrice}</span>

          {formattedComparePrice && (
            <span className="text-xs text-neutral-400 line-through">
              {formattedComparePrice}
            </span>
          )}
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={openProduct}
          className="mt-2 w-full"
        >
          <ShoppingBag size={15} />
          {isOutOfStock ? "View Product" : "Add to Bag"}
        </Button>
      </div>
    </article>
  );
}

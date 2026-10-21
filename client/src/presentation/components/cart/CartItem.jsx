
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}) {
  const { product, variantId, quantity } = item;

  const variant = product.variants?.find(
    (entry) => String(entry._id) === String(variantId)
  );

  const stock = variant?.stock ?? 0;
  const color = variant?.color ?? "Unavailable";
  const size = variant?.size ?? "Unavailable";
  const image = variant?.image || product.image;

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formattedPrice = formatPrice(product.price);
  const lineTotal = formatPrice(product.price * quantity);

  const canIncrease = quantity < stock;

  return (
    <article className="flex gap-4 border-b border-black/10 py-5">
      {/* Product image */}
      <div className="h-28 w-24 shrink-0 bg-neutral-100 sm:h-32 sm:w-28">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            No image
          </div>
        )}
      </div>

      {/* Product details */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-medium">
                {product.name}
              </h3>

              <p className="mt-1 text-xs text-neutral-500">
                {product.category}
              </p>

              <p className="mt-2 text-xs text-neutral-600">
                Color: {color}
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                Size: {size}
              </p>

              <p className="mt-2 text-sm">{formattedPrice}</p>
            </div>

            <button
              type="button"
              onClick={() => onRemove(product._id, variantId)}
              aria-label={`Remove ${product.name}, ${color}, size ${size}`}
              className="shrink-0 p-1 text-neutral-500 transition-colors hover:text-black"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quantity controls */}
          <div className="flex items-center border border-black/15">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() =>
                onUpdateQuantity(
                  product._id,
                  variantId,
                  quantity - 1
                )
              }
              aria-label={`Decrease ${product.name} quantity`}
              className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
            >
              <Minus size={13} />
            </button>

            <span
              aria-label={`Quantity ${quantity}`}
              className="min-w-8 text-center text-xs"
            >
              {quantity}
            </span>

            <button
              type="button"
              disabled={!canIncrease}
              onClick={() =>
                onUpdateQuantity(
                  product._id,
                  variantId,
                  quantity + 1
                )
              }
              aria-label={`Increase ${product.name} quantity`}
              className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
            >
              <Plus size={13} />
            </button>
          </div>

          <p className="text-sm font-medium">{lineTotal}</p>
        </div>
      </div>
    </article>
  );
}
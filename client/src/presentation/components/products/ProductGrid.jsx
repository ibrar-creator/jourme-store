
import { RefreshCw, ShoppingBag } from "lucide-react";
import ProductCard from "./ProductCard.jsx";
import Button from "../common/Button.jsx";

export default function ProductGrid({
  products = [],
  loading = false,
  error = "",
  onAddToCart,
  onRetry,
}) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4"
        aria-label="Loading products"
        aria-busy="true"
      >
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[4/5] bg-neutral-100" />
            <div className="mt-4 h-3 w-1/3 bg-neutral-100" />
            <div className="mt-3 h-4 w-3/4 bg-neutral-100" />
            <div className="mt-3 h-4 w-1/4 bg-neutral-100" />
            <div className="mt-4 h-10 bg-neutral-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
        <RefreshCw size={28} className="mb-4 text-neutral-400" />

        <h3 className="text-lg font-medium">
          Products could not be loaded
        </h3>

        <p className="mt-2 max-w-md text-sm text-neutral-500">
          {error}
        </p>

        {onRetry && (
          <Button
            variant="secondary"
            onClick={onRetry}
            className="mt-5"
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
        <ShoppingBag
          size={30}
          className="mb-4 text-neutral-400"
        />

        <h3 className="text-lg font-medium">
          No products found
        </h3>

        <p className="mt-2 text-sm text-neutral-500">
          Try another category or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}

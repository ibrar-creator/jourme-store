import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useProducts } from "../../application/hooks/useProducts.js";

import MainLayout from "../layouts/MainLayout.jsx";
import ProductGrid from "../components/products/ProductGrid.jsx";

const categories = ["All", "Clothing", "Accessories", "Footwear"];

export default function HomePage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { products, pagination, loading, error, refreshProducts } = useProducts({
    category,
    search,
    page,
    limit: 12,
  });

  function goToPage(nextPage) {
    setPage(nextPage);
    document.getElementById("shop")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  useEffect(() => {
    function handleSearch(event) {
      setSearch(event.detail?.query ?? "");
      setCategory(event.detail?.category || "All");
      setPage(1);

      document.getElementById("shop")?.scrollIntoView({
        behavior: "smooth",
      });
    }

    function handleCategory(event) {
      setCategory(event.detail?.category || "All");
      setSearch("");
      setPage(1);

      document.getElementById("shop")?.scrollIntoView({
        behavior: "smooth",
      });
    }

    window.addEventListener("jourme:search", handleSearch);
    window.addEventListener("jourme:category", handleCategory);

    return () => {
      window.removeEventListener("jourme:search", handleSearch);
      window.removeEventListener("jourme:category", handleCategory);
    };
  }, []);

  return (
    <MainLayout>
      {/* HERO SECTION */}
      <section
        id="home"
        className="relative isolate min-h-[570px] overflow-hidden bg-neutral-100 sm:min-h-[660px] lg:min-h-[720px]"
      >
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2200&q=90"
          alt="Minimal contemporary fashion store"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />

        <div className="absolute inset-0 -z-10 bg-black/35" />

        <div className="mx-auto flex min-h-[570px] max-w-[1440px] flex-col items-start justify-end px-6 pb-16 text-white sm:min-h-[660px] sm:px-12 sm:pb-20 lg:min-h-[720px] lg:px-16 lg:pb-24">
          <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.3em] sm:text-xs">
            LESS, BUT BETTER — COLLECTION 01
          </p>

          <h1 className="max-w-4xl text-5xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-7xl lg:text-[100px]">
            Everyday,
            <br />
            exceptionally
            <br />
            <span className="font-serif italic font-normal">considered.</span>
          </h1>

          <div className="mt-8 flex flex-wrap items-center gap-5 sm:mt-10">
            <a
              href="#shop"
              className="inline-flex items-center gap-5 bg-amber-300 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.17em] text-neutral-300 transition hover:bg-neutral-400"
            >
              Explore collection
              <ArrowRight size={15} />
            </a>

            <span className="max-w-44 text-xs leading-5 text-white/80">
              Thoughtful essentials. Made for everyday living.
            </span>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 hidden items-center gap-2 text-[10px] uppercase tracking-widest text-white/80 sm:flex">
          SCROLL TO DISCOVER
          <ArrowDownRight size={16} />
        </div>
      </section>

      {/* SHOP SECTION */}
      <section
        id="shop"
        className="mx-auto max-w-[1440px] scroll-mt-10 px-5 py-20 sm:px-10 sm:py-28 lg:px-16"
      >
        <div className="mb-10 flex flex-col justify-between gap-7 sm:mb-14 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-neutral-500">
              THE JOURME EDIT
            </p>

            <h2 className="text-4xl font-medium tracking-[-0.055em] sm:text-6xl">
              Considered essentials.
            </h2>

            <p className="mt-4 max-w-md text-sm leading-6 text-neutral-500">
              Pieces that do more with less. Discover the collection built
              around simplicity, quality and everyday use.
            </p>
          </div>

          <span className="text-xs text-neutral-500">
            {loading
              ? "Loading collection..."
              : `${pagination.total} curated pieces`}
          </span>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-neutral-200 pb-5">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCategory(item);
                setPage(1);
              }}
              aria-pressed={category === item}
              className={`border px-4 py-2.5 text-[10px] uppercase tracking-[0.12em] transition ${
                category === item
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-950"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* SEARCH STATUS */}
        {search && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-neutral-600">
              Search results for: <strong>{search}</strong>
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="text-xs underline underline-offset-4"
            >
              Clear search
            </button>
          </div>
        )}

        {/* REUSABLE PRODUCT GRID */}
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
          onRetry={refreshProducts}
        />

        {!loading && !error && pagination.totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-5"
            aria-label="Product pages"
          >
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-neutral-600 transition hover:text-neutral-950 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-xs text-neutral-500" aria-live="polite">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-neutral-600 transition hover:text-neutral-950 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </section>

      {/* PHILOSOPHY SECTION */}
      <section id="philosophy" className="grid bg-neutral-100 md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-16 sm:px-12 sm:py-24 lg:px-20">
          <p className="mb-5 text-[10px] uppercase tracking-[0.25em] text-neutral-500">
            OUR PHILOSOPHY
          </p>

          <h2 className="max-w-lg text-4xl font-medium leading-tight tracking-[-0.055em] sm:text-6xl">
            A little less noise. A lot more meaning.
          </h2>

          <p className="mt-6 max-w-md text-sm leading-7 text-neutral-600">
            We believe the things you use every day should feel intentional.
            Simple forms, useful details and timeless design — without the
            unnecessary.
          </p>

          <a
            href="#shop"
            className="mt-8 inline-flex w-fit items-center gap-3 border-b border-neutral-950 pb-2 text-[10px] uppercase tracking-[0.16em]"
          >
            Discover Jourme
            <ArrowRight size={15} />
          </a>
        </div>

        <div className="min-h-[350px] overflow-hidden sm:min-h-[500px]">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85"
            alt="Thoughtfully curated wardrobe"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </section>
    </MainLayout>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useProducts } from "../../application/hooks/useProducts.js";

import MainLayout from "../layouts/MainLayout.jsx";
import ProductGrid from "../components/products/ProductGrid.jsx";

const categories = ["All", "Clothing", "Accessories", "Footwear"];
const heroSlides = [
  {
    title: "Refined essentials",
    subtitle: "for modern living",
    style: "and everyday wear.",
    copy: "Premium clothing designed with clean silhouettes and lasting comfort.",
    image: "/images/clothing-real.jpg",
    label: "Clothing",
  },
  {
    title: "Elevated finishing",
    subtitle: "touches",
    style: "that complete the look.",
    copy: "Curated accessories that add polish, utility, and ease to daily styling.",
    image: "/images/accessories-real.jpg",
    label: "Accessories",
  },
  {
    title: "Movement-first",
    subtitle: "footwear",
    style: "for everyday confidence.",
    copy: "Minimal, functional shoes built for comfort, versatility, and modern routines.",
    image: "/images/footwear-real.jpg",
    label: "Footwear",
  },
];

export default function HomePage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState(null);
  const lastSlideRef = useRef(0);
  const transitionTimerRef = useRef(null);

  const { products, pagination, loading, error, refreshProducts } = useProducts({
    category,
    search,
    page,
    limit: 12,
  });

  const changeSlide = useCallback((nextIndex) => {
    if (nextIndex === lastSlideRef.current) return;

    setPreviousSlide(lastSlideRef.current);
    lastSlideRef.current = nextIndex;
    setActiveSlide(nextIndex);
    window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      setPreviousSlide(null);
    }, 900);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      changeSlide((lastSlideRef.current + 1) % heroSlides.length);
    }, 5000);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(transitionTimerRef.current);
    };
  }, [changeSlide]);

  function moveSlide(direction) {
    changeSlide((lastSlideRef.current + direction + heroSlides.length) % heroSlides.length);
  }

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

  const activeHero = heroSlides[activeSlide];

  return (
    <MainLayout>
      {/* HERO SECTION */}
      <section
        id="home"
        className="overflow-hidden bg-[#f6f2e9]"
      >
        <div className="grid min-h-[620px] lg:min-h-[700px] lg:grid-cols-2">
          <div className="flex flex-col items-start justify-center px-6 py-14 sm:px-12 sm:py-20 lg:px-16">
            <div key={activeSlide} className="hero-copy-enter">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-amber-600" />
                <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-neutral-500 sm:text-xs">
                  The Jourme edit <span className="px-1 text-neutral-300">/</span>{" "}
                  {activeHero.label}
                </p>
              </div>

              <h1 className="max-w-xl text-5xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-7xl lg:text-[clamp(3rem,4vw,4rem)]">
                {activeHero.title}
                <br />
                {activeHero.subtitle}
                <br />
                <span className="font-serif font-normal italic text-neutral-500">
                  {activeHero.style}
                </span>
              </h1>

              <div className="mt-7 h-px w-16 bg-neutral-300 sm:mt-9" />

              <div className="mt-6 flex flex-wrap items-center gap-5">
                <a
                  href="#shop"
                  onClick={() => {
                    setCategory(activeHero.label);
                    setSearch("");
                    setPage(1);
                  }}
                  className="group inline-flex items-center gap-5 bg-amber-400 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.17em] text-neutral-950 transition-colors duration-300 hover:bg-neutral-950 hover:text-white"
                >
                  Explore {activeHero.label}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </a>

                <span className="max-w-56 text-xs leading-6 text-neutral-600">
                  {activeHero.copy}
                </span>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-3" aria-label="Hero carousel controls">
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => moveSlide(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => moveSlide(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
              >
                <ChevronRight size={18} />
              </button>
              <div className="ml-2 flex items-center gap-2" aria-label="Slide indicators">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.label}
                    type="button"
                    aria-label={`Go to ${slide.label} slide`}
                    onClick={() => changeSlide(index)}
                    className={`h-2.5 rounded-full transition ${
                      index === activeSlide ? "w-8 bg-neutral-950" : "w-2.5 bg-neutral-300 hover:bg-neutral-500"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-[10px] tabular-nums tracking-[0.16em] text-neutral-500">
                0{activeSlide + 1} <span className="text-neutral-300">/</span> 0{heroSlides.length}
              </span>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden bg-[#f6f2e9] sm:min-h-[480px] lg:min-h-full">
            {previousSlide !== null && (
              <img
                src={heroSlides[previousSlide].image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <img
              key={activeSlide}
              src={activeHero.image}
              alt={`${activeHero.label} collection`}
              className="hero-image-enter absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#f6f2e9] via-[#f6f2e9]/60 to-transparent"
            />
          </div>
        </div>
      </section>

      <section
        aria-label="The Jourme difference"
        className="border-y border-neutral-200 bg-white"
      >
        <div className="mx-auto grid max-w-[1440px] divide-y divide-neutral-200 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-10 lg:px-16">
          {[
            { icon: Sparkles, title: "Thoughtfully selected", detail: "A considered edit for everyday life" },
            { icon: PackageCheck, title: "Made to wear on repeat", detail: "Versatile essentials, easy to style" },
            { icon: ShieldCheck, title: "Shop with confidence", detail: "Secure checkout, every time" },
          ].map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex items-center gap-4 py-5 sm:px-6 sm:py-6 first:sm:pl-0 last:sm:pr-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f6f2] text-neutral-800">
                <Icon size={18} strokeWidth={1.6} />
              </span>
              <div>
                <h2 className="text-xs font-medium text-neutral-900">{title}</h2>
                <p className="mt-1 text-xs text-neutral-500">{detail}</p>
              </div>
            </div>
          ))}
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

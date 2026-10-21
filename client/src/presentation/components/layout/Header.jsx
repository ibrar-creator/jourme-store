import { useEffect, useState } from "react";
import {
  ChevronDown,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import {
  getShoppingUser,
} from "../../../infrastructure/services/sellerApi.js";
import { useCart } from "../../../application/context/CartContext.jsx";

const navigationLinks = [
  { label: "Shop all", category: "All" },
  { label: "Clothing", category: "Clothing" },
  { label: "Accessories", category: "Accessories" },
  { label: "Footwear", category: "Footwear" },
  { label: "Our philosophy", href: "#philosophy" },
];

function SearchForm({ mobile = false, onSubmit }) {
  const inputId = mobile ? "mobile-jourme-search" : "jourme-search";

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={`flex min-w-0 overflow-hidden rounded-md border-2 border-transparent bg-white focus-within:border-amber-500 ${
        mobile ? "w-full" : "flex-1"
      }`}
    >
      <label htmlFor={inputId} className="sr-only">
        Search Jourme products
      </label>
      <label htmlFor={`${inputId}-category`} className="sr-only">
        Product category
      </label>
      <select
        id={`${inputId}-category`}
        name="category"
        defaultValue="All"
        className="hidden max-w-36 border-r border-neutral-200 bg-neutral-100 px-2 text-xs text-neutral-700 outline-none sm:block"
      >
        <option value="All">All categories</option>
        <option value="Clothing">Clothing</option>
        <option value="Accessories">Accessories</option>
        <option value="Footwear">Footwear</option>
      </select>
      <input
        id={inputId}
        name="search"
        type="search"
        placeholder="Search Jourme products"
        className="min-w-0 flex-1 px-4 py-2.5 text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
      />
      <button
        type="submit"
        aria-label="Submit product search"
        className="flex w-12 shrink-0 items-center justify-center bg-amber-400 text-neutral-950 transition hover:bg-amber-300"
      >
        <Search size={19} />
      </button>
    </form>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountUser, setAccountUser] = useState(null);
  const { cartCount } = useCart();

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      try {
        const user = await getShoppingUser();
        if (!cancelled) setAccountUser(user);
      } catch (error) {
        if (error.status !== 401 && !cancelled) {
          console.error("Unable to load account details for navigation:", error);
        }
      }
    }

    loadAccount();
    return () => {
      cancelled = true;
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  function openAccount() {
    const eventName =
      accountUser?.role === "seller"
        ? "jourme:seller"
        : accountUser?.role === "admin"
          ? "jourme:admin"
          : "jourme:account";
    window.dispatchEvent(new CustomEvent(eventName));
  }

  function submitSearch(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("search") || "").trim();
    const category = String(formData.get("category") || "All");
    if (!query && category === "All") return;

    window.dispatchEvent(
      new CustomEvent("jourme:search", {
        detail: { query, category },
      })
    );
    closeMenu();
  }

  return (
    <header className="sticky top-0 z-40 bg-neutral-950 text-white shadow-sm">
      <div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center gap-3 px-3 sm:gap-5 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded border border-transparent p-2 hover:border-white lg:hidden"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("jourme:home"))}
          className="shrink-0 rounded border border-transparent px-1 py-2 text-left text-xl font-black tracking-[-0.09em] hover:border-white sm:text-2xl"
          aria-label="Jourme home"
        >
          JOURME<span className="text-amber-400">.</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("jourme:home"))}
          className="hidden shrink-0 items-center gap-1 rounded border border-transparent px-2 py-2 text-left hover:border-white xl:flex"
        >
          <MapPin size={17} />
          <span>
            <span className="block text-[10px] leading-4 text-neutral-300">Deliver to</span>
            <span className="block text-xs font-bold leading-4">Pakistan</span>
          </span>
        </button>

        <div className="hidden min-w-0 flex-1 md:block">
          <SearchForm onSubmit={submitSearch} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={openAccount}
            className="flex min-h-11 items-center gap-2 rounded border border-transparent px-2 text-left hover:border-white sm:px-3"
          >
            <UserRound size={20} className="hidden sm:block" />
            <span>
              <span className="block max-w-28 truncate text-[10px] leading-4 text-neutral-300 sm:max-w-36">
                {accountUser ? `Hello, ${accountUser.name.split(" ")[0]}` : "Hello, sign in"}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold leading-4">
                Account
                <ChevronDown size={13} className="hidden sm:block" />
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={openAccount}
            className="hidden min-h-11 rounded border border-transparent px-3 text-left hover:border-white lg:block"
          >
            <span className="block text-[10px] leading-4 text-neutral-300">Your</span>
            <span className="block text-xs font-bold leading-4">Orders</span>
          </button>

          <button
            type="button"
            aria-label={`Open shopping bag, ${cartCount} items`}
            onClick={() => window.dispatchEvent(new CustomEvent("jourme:open-cart"))}
            className="relative flex min-h-11 items-center gap-1 rounded border border-transparent px-2 hover:border-white sm:px-3"
          >
            <span className="relative">
              <ShoppingBag size={25} strokeWidth={1.7} />
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-neutral-950">
                {cartCount}
              </span>
            </span>
            <span className="hidden self-end pb-1 text-xs font-bold sm:block">Cart</span>
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 px-3 py-2 md:hidden">
        <SearchForm mobile onSubmit={submitSearch} />
      </div>

      <nav
        aria-label="Shop navigation"
        className="hidden min-h-10 items-center gap-1 bg-neutral-800 px-4 text-xs md:flex lg:px-10"
      >
        {navigationLinks.map((link) => (
          link.category ? (
            <button
              key={link.label}
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("jourme:category", {
                    detail: { category: link.category },
                  })
                )
              }
              className="rounded border border-transparent px-3 py-2 hover:border-white"
            >
              {link.label}
            </button>
          ) : (
            <a
              key={link.label}
              href={link.href}
              className="rounded border border-transparent px-3 py-2 hover:border-white"
            >
              {link.label}
            </a>
          )
        ))}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("jourme:seller"))}
          className="ml-auto rounded border border-transparent px-3 py-2 hover:border-white"
        >
          Sell on Jourme
        </button>
      </nav>

      {menuOpen && (
        <nav
          aria-label="Mobile shop navigation"
          className="absolute left-0 right-0 border-t border-white/10 bg-neutral-900 px-4 py-3 shadow-lg md:hidden"
        >
          <div className="flex flex-col">
            {navigationLinks.map((link) => (
              link.category ? (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => {
                    closeMenu();
                    window.dispatchEvent(
                      new CustomEvent("jourme:category", {
                        detail: { category: link.category },
                      })
                    );
                  }}
                  className="border-b border-white/10 py-3 text-left text-sm"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMenu}
                  className="border-b border-white/10 py-3 text-sm"
                >
                  {link.label}
                </a>
              )
            ))}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                window.dispatchEvent(new CustomEvent("jourme:seller"));
              }}
              className="py-3 text-left text-sm"
            >
              Sell on Jourme
            </button>
          </div>
        </nav>
      )}

    </header>
  );
}

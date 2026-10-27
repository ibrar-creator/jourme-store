import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import { fetchSellerProfile, logoutSeller } from "../../infrastructure/services/sellerApi.js";

const summaryItems = [
  {
    label: "Orders",
    value: "0 recent",
    description: "Track purchases and delivery updates.",
    icon: ShoppingBag,
  },
  {
    label: "Saved details",
    value: "2 saved",
    description: "Shipping and billing preferences.",
    icon: MapPin,
  },
  {
    label: "Payments",
    value: "Protected",
    description: "Secure checkout and verified cards.",
    icon: CreditCard,
  },
];

export default function CustomerAccountPage() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCustomerProfile() {
      try {
        const result = await fetchSellerProfile();
        if (!active) return;

        if (result?.data?.user?.role !== "customer") {
          setCustomer(result?.data?.user || null);
          return;
        }

        setCustomer(result?.data?.user || null);
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || "Unable to load your account right now.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCustomerProfile();

    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    try {
      await logoutSeller();
    } finally {
      window.dispatchEvent(new CustomEvent("jourme:home"));
    }
  }

  return (
    <main className="min-h-[calc(100vh-76px)] bg-neutral-50 text-neutral-950">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            className="inline-flex items-center gap-2 self-start rounded border border-neutral-300 bg-white px-4 py-2 text-xs uppercase tracking-[0.12em] text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>

        <section className="mb-8 overflow-hidden border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 border-b border-neutral-200 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                Jourme buyer portal
              </p>
              <h1 className="mt-3 text-4xl font-medium tracking-[-0.06em] sm:text-5xl">
                {loading ? "Loading account..." : `Welcome, ${customer?.name || "back"}.`}
              </h1>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
              <BadgeCheck size={15} />
              Account active
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
            <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Email</p>
              <p className="mt-2 text-sm font-medium text-neutral-900">
                {customer?.email || "Not available"}
              </p>
            </div>

            <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Role</p>
              <p className="mt-2 text-sm font-medium capitalize text-neutral-900">
                {customer?.role || "customer"}
              </p>
            </div>

            <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Status</p>
              <p className="mt-2 text-sm font-medium text-neutral-900">Verified buyer</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {summaryItems.map(({ label, value, description, icon: Icon }) => (
            <article key={label} className="border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">{label}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
                  <Icon size={18} />
                </span>
              </div>
              <p className="text-2xl font-medium tracking-[-0.05em] text-neutral-950">{value}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 border border-neutral-200 bg-white p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
              <Package size={18} />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Account overview</p>
              <h2 className="text-2xl font-medium tracking-[-0.05em]">Your shop experience</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-900">
                <ShoppingBag size={16} />
                Orders & tracking
              </div>
              <p className="text-sm leading-6 text-neutral-600">
                Review recent purchases, track delivery updates, and continue exploring the latest collection.
              </p>
            </div>

            <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-900">
                <ShieldCheck size={16} />
                Security & privacy
              </div>
              <p className="text-sm leading-6 text-neutral-600">
                Your account remains protected with verified sign-ins, secure checkout, and careful order handling.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

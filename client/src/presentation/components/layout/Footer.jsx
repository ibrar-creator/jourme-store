
import { ArrowUpRight } from "lucide-react";

const footerLinks = [
  { label: "Shop Collection", href: "#shop" },
  { label: "Our Philosophy", href: "#philosophy" },
  { label: "Back to Top", href: "#home" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-[1600px] px-5 pb-8 pt-16 sm:px-8 sm:pt-20 lg:px-12">
        <div className="grid gap-12 border-b border-white/15 pb-12 md:grid-cols-2 md:gap-8">
          {/* Brand statement */}
          <div>
            <a
              href="#home"
              className="inline-block text-2xl font-semibold tracking-[0.24em]"
            >
              JOURME<span className="text-neutral-500">.</span>
            </a>

            <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-400">
              Thoughtfully chosen essentials. Timeless design.
              Made for everyday living.
            </p>
          </div>

          {/* Navigation */}
          <div className="md:justify-self-end">
            <p className="mb-5 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Explore
            </p>

            <nav
              aria-label="Footer navigation"
              className="flex flex-col items-start gap-4"
            >
              {footerLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="group inline-flex items-center gap-2 text-sm text-neutral-300 transition-colors hover:text-white"
                >
                  {link.label}

                  <ArrowUpRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 pt-6 text-[10px] tracking-wide text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} Jourme. All rights reserved.
          </p>

          <p>Designed with intention.</p>
        </div>
      </div>
    </footer>
  );
}

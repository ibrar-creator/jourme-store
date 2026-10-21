
import { ArrowRight } from "lucide-react";

export default function AnnouncementBar({
  message = "Complimentary shipping on orders over Rs. 10,000",
  linkText = "Discover more",
  href = "#shop",
}) {
  return (
    <div className="flex min-h-9 items-center justify-center gap-2 bg-black px-4 py-2 text-center text-[10px] tracking-[0.12em] text-white sm:text-xs">
      <p>{message}</p>

      {linkText && href && (
        <a
          href={href}
          className="inline-flex shrink-0 items-center gap-1 underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          <span>{linkText}</span>
          <ArrowRight size={12} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}


import { LoaderCircle } from "lucide-react";

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary:
    "bg-black text-white hover:bg-neutral-800",
  secondary:
    "border border-black bg-white text-black hover:bg-neutral-100",
  ghost:
    "bg-transparent text-black hover:bg-neutral-100",
};

const sizes = {
  sm: "px-3 py-2 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-4 text-sm",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  const variantStyles = variants[variant] ?? variants.primary;
  const sizeStyles = sizes[size] ?? sizes.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {loading && (
        <LoaderCircle
          size={16}
          aria-hidden="true"
          className="animate-spin"
        />
      )}

      {children}
    </button>
  );
}

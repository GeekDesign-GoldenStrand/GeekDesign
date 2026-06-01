"use client";

import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

// ─── Tokens ──────────────────────────────────────────────────────────────────
// Single source of truth for button styling across admin + storefront.
// Adding a new variant or size MUST happen here, not via one-off classNames in
// callsites. See the design spec in docs/ui-buttons.md (if/when added).

type Variant = "primary" | "secondary" | "destructive";
type Size = "sm" | "md" | "lg";
type Section = "admin" | "storefront";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-10 rounded-[8px] px-4 text-sm font-medium",
  md: "h-12 rounded-[10px] px-6 text-[15px] font-semibold",
  // lg uses the storefront's historical 16.742px so existing pixel-perfect
  // layouts (CarritoView, CheckoutForm) don't shift when migrated.
  lg: "h-[61px] rounded-[10px] px-8 text-[16.742px] font-bold",
};

// Primary is the only variant that varies by section — admin is the brand
// red, storefront is the warm wine.
const PRIMARY_CLASSES: Record<Section, string> = {
  admin: "bg-[#df2646] text-white hover:bg-[#c41e3a]",
  storefront: "bg-[#8b434a] text-white hover:bg-[#7a3a41]",
};

const SECONDARY_CLASSES = "bg-white text-[#575757] border border-[#b9b8b8] hover:bg-[#f5f5f5]";

// Destructive uses #c41e00 (already in the palette as the form-button hover)
// — distinct from admin-primary #df2646 (cooler red) so they don't collide
// when they share a row.
const DESTRUCTIVE_CLASSES = "bg-[#c41e00] text-white hover:bg-[#a01800]";

const BASE =
  "inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#df2646] focus-visible:ring-offset-2";

function variantClasses(variant: Variant, section: Section): string {
  switch (variant) {
    case "primary":
      return PRIMARY_CLASSES[section];
    case "secondary":
      return SECONDARY_CLASSES;
    case "destructive":
      return DESTRUCTIVE_CLASSES;
  }
}

function buildClassName(
  variant: Variant,
  size: Size,
  section: Section,
  loading: boolean,
  extra?: string
): string {
  return [
    BASE,
    SIZE_CLASSES[size],
    variantClasses(variant, section),
    loading ? "cursor-wait" : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Defaults to "admin". Pass "storefront" for buttons inside app/(storefront)/**. */
  section?: Section;
  loading?: boolean;
  /**
   * Render the styles onto the single child element instead of a <button>.
   * Use this when a "button" is actually a Link/anchor:
   *   <Button asChild><Link href="/x">Go</Link></Button>
   */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      section = "admin",
      loading = false,
      asChild = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const classes = buildClassName(variant, size, section, loading, className);

    if (asChild) {
      const child = Children.only(children) as ReactNode;
      if (!isValidElement(child)) {
        throw new Error("Button(asChild) requires a single React element child");
      }
      const el = child as ReactElement<{ className?: string }>;
      const merged = {
        ...el.props,
        ...rest,
        className: [classes, el.props.className].filter(Boolean).join(" "),
      };
      return cloneElement(el, merged);
    }

    return (
      <button
        ref={ref}
        type={rest.type ?? "button"}
        disabled={disabled || loading}
        className={classes}
        {...rest}
      >
        {loading ? (
          <>
            <Spinner />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

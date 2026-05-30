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

// Single source of truth for buttons across admin + storefront + auth.
// Colors come from design tokens defined in app/globals.css (@theme).

type Variant = "primary" | "secondary" | "destructive" | "ghost" | "outline-dashed";
type Size = "sm" | "md" | "lg" | "xl";
type Section = "admin" | "storefront";
type Tone = "default" | "danger";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-10 rounded-md px-4 text-[13px] font-medium",
  md: "h-12 rounded-lg px-6 text-[15px] font-semibold",
  lg: "h-[61px] rounded-lg px-8 text-[17px] font-bold",
  // xl — auth/marketing pill. Replaces the legacy PrimaryButton.
  xl: "h-[63px] w-full rounded-full px-8 text-[20px] font-semibold tracking-[1px]",
};

const PRIMARY_CLASSES: Record<Section, string> = {
  admin: "bg-brand text-brand-on hover:bg-brand-hover active:bg-brand-active",
  storefront: "bg-wine text-wine-on hover:bg-wine-hover active:bg-wine-active",
};

const SECONDARY_CLASSES = "bg-white text-ink-muted border border-line hover:bg-surface-muted";

const DESTRUCTIVE_CLASSES = "bg-danger text-white hover:brightness-95 active:brightness-90";

const GHOST_CLASSES = "bg-transparent text-ink hover:bg-surface-muted";

const OUTLINE_DASHED_TONE: Record<Tone, string> = {
  default: "bg-transparent border border-dashed border-ink text-ink hover:bg-surface-muted",
  danger: "bg-transparent border border-dashed border-brand text-brand hover:bg-brand-soft",
};

const BASE =
  "inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

function variantClasses(variant: Variant, section: Section, tone: Tone): string {
  switch (variant) {
    case "primary":
      return PRIMARY_CLASSES[section];
    case "secondary":
      return SECONDARY_CLASSES;
    case "destructive":
      return DESTRUCTIVE_CLASSES;
    case "ghost":
      return GHOST_CLASSES;
    case "outline-dashed":
      return OUTLINE_DASHED_TONE[tone];
  }
}

function buildClassName(
  variant: Variant,
  size: Size,
  section: Section,
  tone: Tone,
  loading: boolean,
  extra?: string
): string {
  return [
    BASE,
    SIZE_CLASSES[size],
    variantClasses(variant, section, tone),
    loading ? "cursor-wait" : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

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

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Defaults to "admin". Pass "storefront" for buttons inside app/(storefront)/**. */
  section?: Section;
  /** Only respected by variant="outline-dashed". */
  tone?: Tone;
  loading?: boolean;
  /**
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
      tone = "default",
      loading = false,
      asChild = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const classes = buildClassName(variant, size, section, tone, loading, className);

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

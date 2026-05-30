"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

// Dashed-bordered row-action button.

type Tone = "default" | "danger";

const toneClasses: Record<Tone, string> = {
  default: "border-ink text-ink hover:bg-surface-muted",
  danger: "border-brand text-brand hover:bg-brand-soft",
};

const BASE =
  "flex items-center justify-center border border-dashed rounded-sm text-[14px] font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

function buildClasses(tone: Tone, hasLabel: boolean, extra?: string) {
  const padding = hasLabel ? "gap-1.5 px-3 py-2" : "p-2";
  return [BASE, padding, toneClasses[tone], extra].filter(Boolean).join(" ");
}

interface CommonProps {
  tone?: Tone;
  icon?: ReactNode;
  label?: string;
  children?: ReactNode;
}

export function ActionButton({
  tone = "default",
  icon,
  label,
  children,
  className,
  ...rest
}: CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const hasLabel = Boolean(label);
  return (
    <button
      type="button"
      className={buildClasses(
        tone,
        hasLabel,
        hasLabel ? `flex-1 min-w-[80px] ${className ?? ""}` : `flex-none ${className ?? ""}`
      )}
      {...rest}
    >
      {icon}
      {label}
      {children}
    </button>
  );
}

export function ActionLink({
  tone = "default",
  icon,
  label,
  children,
  href,
  className,
  ...rest
}: CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children">) {
  const hasLabel = Boolean(label);
  const disabled = !href;
  return (
    <a
      href={href}
      aria-disabled={disabled}
      className={buildClasses(
        tone,
        hasLabel,
        `${hasLabel ? "flex-1 min-w-[80px]" : "flex-none"} aria-disabled:opacity-40 aria-disabled:pointer-events-none ${className ?? ""}`
      )}
      {...rest}
    >
      {icon}
      {label}
      {children}
    </a>
  );
}

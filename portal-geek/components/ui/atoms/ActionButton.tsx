"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "default" | "danger";

const toneClasses: Record<Tone, string> = {
  default: "border-[#1e1e1e] text-[#1e1e1e] hover:bg-[#f5f5f5]",
  danger: "border-[#e42200] text-[#e42200] hover:bg-[#fff5f5]",
};

function buildClasses(tone: Tone, hasLabel: boolean, extra?: string) {
  const padding = hasLabel ? "gap-1.5 px-3 py-2" : "p-2";
  return [
    "flex items-center justify-center border border-dashed rounded-[7px] text-[14px] font-medium shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-colors",
    padding,
    toneClasses[tone],
    extra,
  ]
    .filter(Boolean)
    .join(" ");
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

"use client";

import type { ReactNode } from "react";

interface LoadingStateProps {
  label?: string;
  children?: ReactNode;
  size?: "compact" | "default";
  className?: string;
}

const SPINNER_SIZE = { compact: 32, default: 48 } as const;

export function LoadingState({
  label = "Cargando…",
  children,
  size = "default",
  className = "",
}: LoadingStateProps) {
  const px = SPINNER_SIZE[size];
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex w-full flex-col items-center justify-center gap-3 py-12 text-ink-subtle ${className}`}
    >
      <svg
        className="animate-spin text-brand"
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="text-[14px]">{label}</span>}
      {children}
    </div>
  );
}

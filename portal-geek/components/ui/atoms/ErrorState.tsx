"use client";

import type { ReactNode } from "react";

import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Algo salió mal",
  description = "No pudimos cargar la información. Intenta de nuevo en unos momentos.",
  onRetry,
  retryLabel = "Reintentar",
  action,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-brand-softer bg-brand-soft px-6 py-10 text-center ${className}`}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand"
        aria-hidden
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 8v5m0 3.5h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      <p className="max-w-prose text-[13px] text-ink-muted">{description}</p>
      <div className="mt-1 flex items-center gap-2">
        {onRetry && (
          <Button variant="primary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

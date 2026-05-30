"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "fresh" | "filtered" | "info";
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line bg-surface-muted px-6 py-12 text-center ${className}`}
    >
      {icon && (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-subtle"
          aria-hidden
        >
          {icon}
        </div>
      )}
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      {description && <p className="max-w-prose text-[13px] text-ink-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

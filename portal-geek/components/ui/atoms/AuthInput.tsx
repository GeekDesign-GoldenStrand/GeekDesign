"use client";

import Image from "next/image";
import type { InputHTMLAttributes } from "react";

export interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: "email" | "lock";
  error?: string;
}

export function AuthInput({ label, icon, error, className, ...props }: AuthInputProps) {
  const errorId = error ? `${props.name}-error` : undefined;

  return (
    <label className="relative block w-full">
      <span className="sr-only">{label}</span>

      {icon && (
        <Image
          src={`/images/login/${icon}.png`}
          alt=""
          width={34}
          height={34}
          aria-hidden
          className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 opacity-40"
        />
      )}

      <input
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
        className={[
          "h-[62px] w-full rounded-full border border-[#a79999] bg-white",
          "text-[16px] tracking-[0.8px] text-ink",
          "shadow-md outline-none transition-colors",
          "placeholder:text-ink-subtle focus:border-brand",
          "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          "disabled:opacity-60",
          icon ? "pl-[116px]" : "pl-8",
          "pr-8",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {error && (
        <p id={errorId} role="alert" className="mt-1 px-4 text-[13px] text-brand">
          {error}
        </p>
      )}
    </label>
  );
}

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
          "text-[16px] tracking-[0.8px] text-[#333]",
          "shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] outline-none",
          "placeholder:text-[#8e908f] focus:border-[#df2646] disabled:opacity-60",
          icon ? "pl-[116px]" : "pl-8",
          "pr-8",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {error && (
        <p id={errorId} role="alert" className="mt-1 px-4 text-[13px] text-[#df2646]">
          {error}
        </p>
      )}
    </label>
  );
}

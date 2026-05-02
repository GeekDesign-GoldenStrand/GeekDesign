"use client";

import Image from "next/image";
import { useState } from "react";

import { Eye, EyeSlash } from "@phosphor-icons/react";

export interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  name?: string;
  /** Reserve left padding for a lock icon (login page layout). */
  hasIcon?: boolean;
  error?: string;
}

export function PasswordField({
  value,
  onChange,
  disabled,
  placeholder = "Contraseña",
  autoComplete = "current-password",
  name = "password",
  hasIcon = false,
  error,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const errorId = error ? `${name}-error` : undefined;

  return (
    <label className="relative block w-full">
      <span className="sr-only">{placeholder}</span>

      {hasIcon && (
        <Image
          src="/images/login/lock.png"
          alt=""
          width={34}
          height={34}
          aria-hidden
          className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 opacity-40"
        />
      )}

      <input
        type={show ? "text" : "password"}
        name={name}
        autoComplete={autoComplete}
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`h-[62px] w-full rounded-full border border-[#a79999] bg-white text-[16px] tracking-[0.8px] text-[#333] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] outline-none placeholder:text-[#8e908f] focus:border-[#df2646] disabled:opacity-60 pr-14 ${
          hasIcon ? "pl-[116px]" : "pl-8"
        }`}
      />

      <button
        type="button"
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        onClick={() => setShow((s) => !s)}
        disabled={disabled}
        className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8e908f] hover:text-[#df2646] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#df2646] focus-visible:ring-offset-2 rounded disabled:pointer-events-none"
      >
        {show ? <EyeSlash size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
      </button>

      {error && (
        <p id={errorId} role="alert" className="mt-1 px-4 text-[13px] text-[#df2646]">
          {error}
        </p>
      )}
    </label>
  );
}

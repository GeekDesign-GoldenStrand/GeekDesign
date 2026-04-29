"use client";

import Image from "next/image";
import { useState } from "react";

function EyeOpenIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

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
        {show ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>
      {error && (
        <p id={errorId} role="alert" className="mt-1 px-4 text-[13px] text-[#df2646]">
          {error}
        </p>
      )}
    </label>
  );
}

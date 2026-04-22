"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

import { PasswordField } from "@/components/ui/molecules/PasswordField";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordReset = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Correo o contraseña incorrectos");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-4" noValidate>
      <label className="relative block w-full">
        <span className="sr-only">Correo electrónico</span>
        <Image
          src="/images/login/email.png"
          alt=""
          width={34}
          height={34}
          aria-hidden
          className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 opacity-40"
        />
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className="h-[62px] w-full rounded-full border border-[#a79999] bg-white pl-[116px] pr-8 text-[16px] tracking-[0.8px] text-[#333] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] outline-none placeholder:text-[#8e908f] focus:border-[#df2646] disabled:opacity-60"
        />
      </label>

      <PasswordField
        value={password}
        onChange={setPassword}
        disabled={isSubmitting}
        placeholder="Contraseña"
        autoComplete="current-password"
        name="password"
        hasIcon
      />

      {passwordReset && (
        <p role="status" className="text-[14px] text-green-600 tracking-[0.5px]">
          Contraseña actualizada. Ya puedes iniciar sesión.
        </p>
      )}

      {error && (
        <p role="alert" className="text-[14px] text-[#df2646] tracking-[0.5px]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 h-[63px] w-full rounded-full bg-[#8b434a] font-semibold text-[20px] tracking-[1px] text-white transition-colors hover:bg-[#7a3a41] focus:outline-none focus:ring-2 focus:ring-[#df2646] focus:ring-offset-2 focus:ring-offset-[#fff8f9] disabled:opacity-60"
      >
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </button>

      <a
        href="/recuperar-contrasena"
        className="font-light text-[13px] tracking-[0.65px] text-[#df2646] hover:underline"
      >
        Olvidé mi contraseña
      </a>
    </form>
  );
}

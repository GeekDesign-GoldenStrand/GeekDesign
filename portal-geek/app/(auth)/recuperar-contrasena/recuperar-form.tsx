"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AuthInput } from "@/components/ui/atoms/AuthInput";
import { PrimaryButton } from "@/components/ui/atoms/PrimaryButton";

export function RecuperarForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(json?.error ?? "Error al enviar la solicitud");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex w-full flex-col items-center gap-6 text-center">
        <p className="text-[15px] leading-relaxed tracking-[0.5px] text-[#555]">
          Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en los
          próximos minutos.
        </p>
        <Link
          href="/login"
          className="font-light text-[13px] tracking-[0.65px] text-[#df2646] hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-4" noValidate>
      <AuthInput
        label="Correo electrónico"
        type="email"
        name="email"
        autoComplete="email"
        required
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isSubmitting}
        icon="email"
      />

      {error && (
        <p role="alert" className="text-[14px] text-[#df2646] tracking-[0.5px]">
          {error}
        </p>
      )}

      <PrimaryButton type="submit" variant="red" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Enviando…" : "Enviar link"}
      </PrimaryButton>

      <Link
        href="/login"
        className="font-light text-[13px] tracking-[0.65px] text-[#df2646] hover:underline"
      >
        Volver al inicio de sesión
      </Link>
    </form>
  );
}

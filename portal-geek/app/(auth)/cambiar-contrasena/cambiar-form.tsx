"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { PasswordField } from "@/components/ui/password-field";
import { PrimaryButton } from "@/components/ui/primary-button";

interface Props {
  token: string;
}

export function CambiarForm({ token }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? "No se pudo actualizar la contraseña");
        return;
      }
      router.push("/login?reset=1");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-4" noValidate>
      <PasswordField
        value={password}
        onChange={setPassword}
        disabled={isSubmitting}
        placeholder="Nueva contraseña"
        autoComplete="new-password"
        name="password"
        hasIcon
      />

      <PasswordField
        value={confirmPassword}
        onChange={setConfirmPassword}
        disabled={isSubmitting}
        placeholder="Confirmar contraseña"
        autoComplete="new-password"
        name="confirmPassword"
        hasIcon
      />

      {error && (
        <p role="alert" className="text-[14px] text-[#df2646] tracking-[0.5px]">
          {error}
        </p>
      )}

      <PrimaryButton type="submit" variant="wine" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Guardando…" : "Aceptar"}
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

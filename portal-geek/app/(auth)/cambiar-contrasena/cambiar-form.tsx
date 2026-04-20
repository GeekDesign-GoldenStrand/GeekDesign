"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

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
      <input
        type="password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isSubmitting}
        className="h-[62px] w-full rounded-full border border-[#a79999] bg-white px-8 text-[16px] tracking-[0.8px] text-[#333] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] outline-none placeholder:text-[#8e908f] focus:border-[#df2646] disabled:opacity-60"
      />

      <input
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isSubmitting}
        className="h-[62px] w-full rounded-full border border-[#a79999] bg-white px-8 text-[16px] tracking-[0.8px] text-[#333] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] outline-none placeholder:text-[#8e908f] focus:border-[#df2646] disabled:opacity-60"
      />

      {error && (
        <p role="alert" className="text-[14px] text-[#df2646] tracking-[0.5px]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-[63px] w-full rounded-full bg-[#8b434a] font-semibold text-[18px] tracking-[1px] text-white transition-colors hover:bg-[#7a3a41] focus:outline-none focus:ring-2 focus:ring-[#df2646] focus:ring-offset-2 disabled:opacity-60"
      >
        {isSubmitting ? "Guardando…" : "Actualizar contraseña"}
      </button>

      <Link
        href="/login"
        className="font-light text-[13px] tracking-[0.65px] text-[#df2646] hover:underline"
      >
        Volver al inicio de sesión
      </Link>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/ui/password-field";

export function CambiarContrasenaForm() {
  const [fields, setFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(name: string, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (fields.newPassword !== fields.confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      const json = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(json?.error ?? "Error al cambiar la contraseña");
        return;
      }

      setSuccess(true);
      setFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4" noValidate>
      <PasswordField
        value={fields.currentPassword}
        onChange={(v) => handleChange("currentPassword", v)}
        disabled={isSubmitting}
        placeholder="Contraseña actual"
        autoComplete="current-password"
        name="currentPassword"
      />
      <PasswordField
        value={fields.newPassword}
        onChange={(v) => handleChange("newPassword", v)}
        disabled={isSubmitting}
        placeholder="Nueva contraseña"
        autoComplete="new-password"
        name="newPassword"
      />
      <PasswordField
        value={fields.confirmPassword}
        onChange={(v) => handleChange("confirmPassword", v)}
        disabled={isSubmitting}
        placeholder="Confirmar nueva contraseña"
        autoComplete="new-password"
        name="confirmPassword"
      />

      {error && (
        <p role="alert" className="px-2 text-[14px] tracking-[0.5px] text-[#df2646]">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="px-2 text-[14px] tracking-[0.5px] text-green-600">
          Contraseña actualizada correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-[63px] w-full rounded-full bg-[#8b434a] font-semibold text-[18px] tracking-[1px] text-white transition-colors hover:bg-[#7a3a41] focus:outline-none focus:ring-2 focus:ring-[#df2646] focus:ring-offset-2 disabled:opacity-60"
      >
        {isSubmitting ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}

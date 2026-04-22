"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { PasswordField } from "@/components/ui/password-field";

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function validateFields(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): FieldErrors {
  const errors: FieldErrors = {};

  if (!currentPassword) {
    errors.currentPassword = "La contraseña actual es requerida";
  }

  if (newPassword.length < 8) {
    errors.newPassword = "La contraseña debe tener al menos 8 caracteres";
  } else if (!/[A-Z]/.test(newPassword)) {
    errors.newPassword = "La contraseña debe contener al menos una mayúscula";
  } else if (!/[0-9]/.test(newPassword)) {
    errors.newPassword = "La contraseña debe contener al menos un número";
  }

  if (!errors.newPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas nuevas no coinciden";
  }

  return errors;
}

export function CambiarContrasenaForm() {
  const router = useRouter();
  const [fields, setFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(name: string, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const errors = validateFields(
      fields.currentPassword,
      fields.newPassword,
      fields.confirmPassword
    );
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: fields.currentPassword,
          newPassword: fields.newPassword,
          confirmPassword: fields.confirmPassword,
        }),
      });

      if (res.status === 401) {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        return;
      }

      const json = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(json?.error ?? "Error al cambiar la contraseña");
        return;
      }

      setSuccess(true);
      await fetch("/api/auth/logout", { method: "POST" });
      setTimeout(() => router.push("/login"), 1500);
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
        error={fieldErrors.currentPassword}
      />
      <PasswordField
        value={fields.newPassword}
        onChange={(v) => handleChange("newPassword", v)}
        disabled={isSubmitting}
        placeholder="Nueva contraseña"
        autoComplete="new-password"
        name="newPassword"
        error={fieldErrors.newPassword}
      />
      <PasswordField
        value={fields.confirmPassword}
        onChange={(v) => handleChange("confirmPassword", v)}
        disabled={isSubmitting}
        placeholder="Confirmar nueva contraseña"
        autoComplete="new-password"
        name="confirmPassword"
        error={fieldErrors.confirmPassword}
      />

      {error && (
        <p role="alert" className="px-2 text-[14px] tracking-[0.5px] text-[#df2646]">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="px-2 text-[14px] tracking-[0.5px] text-green-600">
          Contraseña actualizada correctamente. Redirigiendo…
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || success}
        className="mt-2 h-[63px] w-full rounded-full bg-[#8b434a] font-semibold text-[18px] tracking-[1px] text-white transition-colors hover:bg-[#7a3a41] focus:outline-none focus:ring-2 focus:ring-[#df2646] focus:ring-offset-2 disabled:opacity-60"
      >
        {isSubmitting ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { PasswordField } from "@/components/ui/molecules/PasswordField";
import { PrimaryButton } from "@/components/ui/atoms/PrimaryButton";
import { ChangePasswordSchema } from "@/lib/schemas/auth";

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const EMPTY_FIELDS = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function CambiarContrasenaForm() {
  const router = useRouter();
  const [fields, setFields] = useState(EMPTY_FIELDS);
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

    const result = ChangePasswordSchema.safeParse(fields);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
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

      setFields(EMPTY_FIELDS);
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
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-4" noValidate>
      <PasswordField
        value={fields.currentPassword}
        onChange={(v) => handleChange("currentPassword", v)}
        disabled={isSubmitting}
        placeholder="Contraseña actual"
        autoComplete="current-password"
        name="currentPassword"
        hasIcon
        error={fieldErrors.currentPassword}
      />
      <PasswordField
        value={fields.newPassword}
        onChange={(v) => handleChange("newPassword", v)}
        disabled={isSubmitting}
        placeholder="Nueva contraseña"
        autoComplete="new-password"
        name="newPassword"
        hasIcon
        error={fieldErrors.newPassword}
      />
      <PasswordField
        value={fields.confirmPassword}
        onChange={(v) => handleChange("confirmPassword", v)}
        disabled={isSubmitting}
        placeholder="Confirmar nueva contraseña"
        autoComplete="new-password"
        name="confirmPassword"
        hasIcon
        error={fieldErrors.confirmPassword}
      />

      {error && (
        <p role="alert" className="text-[14px] tracking-[0.5px] text-[#df2646]">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-[14px] tracking-[0.5px] text-green-600">
          Contraseña actualizada. Redirigiendo…
        </p>
      )}

      <PrimaryButton type="submit" variant="red" disabled={isSubmitting || success} className="mt-2">
        {isSubmitting ? "Guardando…" : "Cambiar contraseña"}
      </PrimaryButton>
    </form>
  );
}

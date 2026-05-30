"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

import { AuthInput } from "@/components/ui/atoms/AuthInput";
import { Button } from "@/components/ui/atoms/Button";
import { PasswordField } from "@/components/ui/molecules/PasswordField";
import { landingPath, normalizeRole } from "@/lib/auth/access";

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
      // Land each role where it has access — Direccion gets the metrics
      // dashboard; the others go straight to their working section.
      const { data } = await res.json();
      router.push(landingPath(normalizeRole(data?.user?.rol ?? "")));
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      className="flex w-full flex-col items-center gap-4"
      noValidate
    >
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
        <p role="alert" className="text-[14px] text-brand tracking-[0.5px]">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="xl"
        section="admin"
        loading={isSubmitting}
        className="mt-4"
      >
        {isSubmitting ? "Ingresando…" : "Iniciar Sesión"}
      </Button>

      <a
        href="/recuperar-contrasena"
        className="font-light text-[15px] tracking-[0.75px] text-brand hover:underline"
      >
        Olvidé mi contraseña
      </a>
    </form>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

import { AuthInput } from "@/components/ui/atoms/AuthInput";
import { PasswordField } from "@/components/ui/molecules/PasswordField";
import { PrimaryButton } from "@/components/ui/atoms/PrimaryButton";

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
        <p role="alert" className="text-[14px] text-[#df2646] tracking-[0.5px]">
          {error}
        </p>
      )}

      <PrimaryButton type="submit" variant="red" disabled={isSubmitting} className="mt-4">
        {isSubmitting ? "Ingresando…" : "Iniciar Sesión"}
      </PrimaryButton>

      <a
        href="/recuperar-contrasena"
        className="font-light text-[15px] tracking-[0.75px] text-[#df2646] hover:underline"
      >
        Olvidé mi contraseña
      </a>
    </form>
  );
}

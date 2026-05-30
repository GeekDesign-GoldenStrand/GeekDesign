"use client";

import { SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/atoms/ConfirmDialog";

export function LogoutButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("No se pudo cerrar la sesión");
      setIsOpen(false);
      router.push("/login");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Cerrar sesión"
        className="shrink-0 cursor-pointer"
      >
        <SignOut size={30} weight="light" className="text-ink hover:text-wine transition-colors" />
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => (loading ? null : setIsOpen(false))}
        onConfirm={handleLogout}
        title="Cerrar sesión"
        description="¿Deseas cerrar sesión? Tendrás que iniciar sesión nuevamente para volver a entrar."
        confirmLabel="Cerrar sesión"
        loadingLabel="Cerrando sesión..."
        cancelLabel="Cancelar"
        variant="danger"
        loading={loading}
        error={error}
      />
    </>
  );
}

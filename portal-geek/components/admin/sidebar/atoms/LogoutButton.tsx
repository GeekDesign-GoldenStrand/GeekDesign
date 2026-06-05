"use client";

import { SignOutIcon } from "@phosphor-icons/react";
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
        className="mt-auto text-[#1e1e1e] hover:text-[#e42200] transition-colors shrink-0 pb-4"
      >
        <SignOutIcon className="w-6 h-6 md:w-8 md:h-8" />
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

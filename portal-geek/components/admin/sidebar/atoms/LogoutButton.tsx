"use client";

import { useRouter } from "next/navigation";

import { SignOut } from "@phosphor-icons/react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Cerrar sesión"
      className="mt-2 text-[#1e1e1e] hover:opacity-70 transition-opacity shrink-0"
    >
      <SignOut size={32} />
    </button>
  );
}

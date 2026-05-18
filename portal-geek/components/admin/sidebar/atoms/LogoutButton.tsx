"use client";

import { SignOutIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

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
      className="mt-auto text-[#1e1e1e] hover:text-[#e42200] transition-colors shrink-0 pb-4"
    >
      <SignOutIcon className="w-6 h-6 md:w-8 md:h-8" />
    </button>
  );
}

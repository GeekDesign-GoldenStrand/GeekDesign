"use client";

import { SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} aria-label="Cerrar sesión" className="shrink-0 cursor-pointer">
      <SignOut
        size={30}
        weight="light"
        className="text-[#1e1e1e] hover:text-[#df2646] transition-colors"
      />
    </button>
  );
}

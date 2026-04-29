"use client";

import { useRouter } from "next/navigation";

function LogoutIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16h14M20 10l6 6-6 6" />
      <path d="M18 6H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10" />
    </svg>
  );
}

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
      <LogoutIcon />
    </button>
  );
}

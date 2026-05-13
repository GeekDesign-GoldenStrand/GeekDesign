import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ADMIN_ROLES } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";

import { TercerosView } from "./terceros-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Terceros | Geek Design" };

export default async function TercerosPage() {
  // Server-side session and role validation (Project best practice)
  const session = await getSession();

  // If no session or not an administrative role, redirect to login
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect("/login");
  }

  return <TercerosView />;
}

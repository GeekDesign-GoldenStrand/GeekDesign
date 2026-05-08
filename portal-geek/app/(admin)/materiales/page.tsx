import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import type { UserRole } from "@/types";

import { MaterialesView } from "./materiales-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Materiales — Geek Design" };

const ALLOWED_ROLES: UserRole[] = ["Direccion", "Colaborador"];

export default async function MaterialesPage() {
  const session = await getSession();
  if (!session || !ALLOWED_ROLES.includes(session.role)) redirect("/login");

  return <MaterialesView />;
}

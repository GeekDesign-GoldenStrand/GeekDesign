import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ADMIN_ROLES } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";

import { ClientesView } from "./clientes-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Clientes | Geek Design" };

export default async function ClientesPage() {
  // Validación de sesión y rol en el servidor (Mejor práctica del proyecto)
  const session = await getSession();

  // Si no hay sesión o no es un rol administrativo (Direccion/Administrador), redirigir
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    redirect("/login");
  }

  return <ClientesView />;
}

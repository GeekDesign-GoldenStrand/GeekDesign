import { redirect } from "next/navigation";

import { landingPath, normalizeRole } from "@/lib/auth/access";
import { getSession } from "@/lib/auth/session";

// Root entry point. Logged-in staff land on their role's home (Direccion →
// /dashboard, Colaborador/Finanzas → /pedidos). Anonymous visitors go to the
// public storefront.
export default async function RootPage() {
  const session = await getSession();
  if (session) {
    redirect(landingPath(normalizeRole(session.role)));
  }
  redirect("/tienda");
}

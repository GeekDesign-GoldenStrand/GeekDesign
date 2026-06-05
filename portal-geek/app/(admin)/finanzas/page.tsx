import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { EnConstruccion } from "@/components/admin/organisms/EnConstruccion";
import { can, landingPath } from "@/lib/auth/access";
import type { Role } from "@/lib/auth/access";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Finanzas" };

export default async function FinanzasPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Finanzas is the home section for the Finanzas role (and readable by Direccion).
  // Roles that can't read it never see the page — bounce them to their landing.
  // landingPath returns /finanzas only for roles that *can* read it, so no loop.
  const role = session.role as Role;
  if (!can(role, "finanzas", "read")) redirect(landingPath(role));

  return (
    <>
      <AdminHeader title="Finanzas" />
      <EnConstruccion message="Gastos y pagos estarán disponibles pronto." />
    </>
  );
}

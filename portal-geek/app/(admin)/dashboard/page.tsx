import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { can, landingPath } from "@/lib/auth/access";
import type { Role } from "@/lib/auth/access";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // The dashboard is the company-wide metrics home (metricas is Direccion-only).
  // Roles that can't read it never see the page — bounce them to their landing.
  // landingPath only returns /dashboard for roles that *can* read metricas, so
  // this can't loop.
  const role = session.role as Role;
  if (!can(role, "metricas", "read")) redirect(landingPath(role));

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="px-8 py-8">
        <p className="text-[#888]">Bienvenido al panel de administración.</p>
      </div>
    </>
  );
}

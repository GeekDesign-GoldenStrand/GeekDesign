import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { ADMIN_ROLES } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";

import MaquinasGrid from "./maquinas-grid";

export const metadata: Metadata = { title: "Máquinas" };

export default async function MaquinasPage() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/login");

  return (
    <div>
      <AdminHeader title="Máquinas" />
      <MaquinasGrid />
    </div>
  );
}

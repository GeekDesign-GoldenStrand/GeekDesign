import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { FacturacionTemplate } from "@/components/admin/templates/FacturacionTemplate";
import { can, landingPath } from "@/lib/auth/access";
import type { Role } from "@/lib/auth/access";
import { getSession } from "@/lib/auth/session";
import { getPedidosParaFacturar } from "@/lib/services/finanzas";

export const metadata: Metadata = { title: "Finanzas" };

export const dynamic = "force-dynamic";

export default async function FinanzasPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = session.role as Role;
  if (!can(role, "finanzas", "read")) redirect(landingPath(role));

  const pedidos = await getPedidosParaFacturar();

  return (
    <>
      <AdminHeader title="Finanzas" />
      <FacturacionTemplate pedidos={pedidos} />
    </>
  );
}

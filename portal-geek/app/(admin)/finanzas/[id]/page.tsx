import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { FacturacionDetailTemplate } from "@/components/admin/templates/FacturacionDetailTemplate";
import { can, landingPath } from "@/lib/auth/access";
import type { Role } from "@/lib/auth/access";
import { getSession } from "@/lib/auth/session";
import { getPedidoFacturacion } from "@/lib/services/finanzas";

export const dynamic = "force-dynamic";

export default async function FinanzasDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const role = session.role as Role;
  if (!can(role, "finanzas", "read")) redirect(landingPath(role));

  const pedido = await getPedidoFacturacion(Number(id));
  if (!pedido) redirect("/finanzas");

  const folio = pedido.cotizaciones[0]?.folio ?? `#${pedido.id_pedido}`;

  return (
    <>
      <AdminHeader title={`Facturación — ${folio}`} />
      <FacturacionDetailTemplate pedido={pedido} />
    </>
  );
}

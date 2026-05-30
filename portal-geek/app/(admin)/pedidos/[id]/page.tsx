import { requireRoles } from "@/lib/auth/page-guard";
import type { UserRole } from "@/types";

import DetailPage from "./pedido-detail";

// PE-05: detailed pedido view is Dirección-only. Section guard (pedidos:read)
// would also let Colaborador/Finanzas through; the role gate is the within-
// section refinement. See lib/auth/page-guard.ts requireRoles.
export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRoles(["Direccion"]);

  return <DetailPage id={id} role={session.role as UserRole} />;
}

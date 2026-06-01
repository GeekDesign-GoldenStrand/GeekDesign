import { requireSection } from "@/lib/auth/page-guard";
import { parseDetalleIds } from "@/lib/utils/pedido-detalle-ids";
import type { UserRole } from "@/types";

import DetailPage from "./pedido-detail";

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ detalleIds?: string }>;
}) {
  const { id } = await params;
  const { detalleIds } = await searchParams;
  const session = await requireSection("pedidos");

  return (
    <DetailPage id={id} role={session.role as UserRole} detalleIds={parseDetalleIds(detalleIds)} />
  );
}

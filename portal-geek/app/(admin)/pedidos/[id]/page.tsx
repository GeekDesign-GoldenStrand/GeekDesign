import { requireSection } from "@/lib/auth/page-guard";
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

  const detalleIdList = detalleIds
    ? detalleIds
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0)
    : null;

  return (
    <DetailPage
      id={id}
      role={session.role as UserRole}
      detalleIds={detalleIdList?.length ? detalleIdList : null}
    />
  );
}

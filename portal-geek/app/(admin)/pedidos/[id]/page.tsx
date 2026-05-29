import { requireSection } from "@/lib/auth/page-guard";
import type { UserRole } from "@/types";

import DetailPage from "./pedido-detail";

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSection("pedidos");

  return <DetailPage id={id} role={session.role as UserRole} />;
}

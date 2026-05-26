import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";
import type { UserRole } from "@/types";

import { PedidosView } from "./pedidos-view";

export const metadata: Metadata = { title: "Pedidos" };

export default async function PedidosPage() {
  // requireSection enforces session + read access; returns the validated session.
  const session = await requireSection("pedidos");

  return <PedidosView role={session.role as UserRole} />;
}

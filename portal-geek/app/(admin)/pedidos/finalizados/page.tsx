import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";
import type { UserRole } from "@/types";

import { FinalizadosView } from "./finalizados-view";

export const metadata: Metadata = { title: "Pedidos Completados / Cancelados" };

export default async function PedidosFinalizadosPage() {
  // requireSection enforces session + read access; returns the validated session.
  const session = await requireSection("pedidos");

  return <FinalizadosView role={session.role as UserRole} />;
}

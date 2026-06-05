import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

export const metadata: Metadata = { title: "Pedidos" };

export default async function PedidosLayout({ children }: { children: React.ReactNode }) {
  await requireSection("pedidos");
  return children;
}

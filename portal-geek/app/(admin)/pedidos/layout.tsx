import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pedidos" };

export default function PedidosLayout({ children }: { children: React.ReactNode }) {
  return children;
}

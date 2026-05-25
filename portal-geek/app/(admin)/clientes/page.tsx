import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

import { ClientesView } from "./clientes-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage() {
  await requireSection("clientes");

  return <ClientesView />;
}

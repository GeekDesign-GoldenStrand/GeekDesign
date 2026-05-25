import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

import { ColaboradoresView } from "./colaboradores-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Colaboradores" };

export default async function ColaboradoresPage() {
  await requireSection("colaboradores");

  return <ColaboradoresView />;
}

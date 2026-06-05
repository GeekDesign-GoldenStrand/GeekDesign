import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

import { MaterialesView } from "./materiales-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Materiales" };

export default async function MaterialesPage() {
  const session = await requireSection("materiales");

  return <MaterialesView role={session.role} />;
}

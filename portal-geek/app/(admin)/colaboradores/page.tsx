import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

import { ColaboradoresView } from "./colaboradores-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Colaboradores" };

export default async function ColaboradoresPage() {
  const session = await requireSection("colaboradores");

  return <ColaboradoresView currentUserId={session.id} />;
}

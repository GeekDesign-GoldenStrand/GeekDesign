import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

import { TercerosView } from "./terceros-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Terceros | Geek Design" };

export default async function TercerosPage() {
  await requireSection("terceros");
  return <TercerosView />;
}

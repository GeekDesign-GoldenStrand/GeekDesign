import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

export const metadata: Metadata = { title: "Terceros" };

export default async function TercerosLayout({ children }: { children: React.ReactNode }) {
  await requireSection("terceros");
  return children;
}

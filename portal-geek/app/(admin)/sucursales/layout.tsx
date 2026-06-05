import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

export const metadata: Metadata = { title: "Sucursales" };

export default async function SucursalesLayout({ children }: { children: React.ReactNode }) {
  await requireSection("sucursales");
  return children;
}

import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

export const metadata: Metadata = { title: "Servicios | Geek Design" };

export default async function ServiciosLayout({ children }: { children: React.ReactNode }) {
  await requireSection("servicios");
  return children;
}

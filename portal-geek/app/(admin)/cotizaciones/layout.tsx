import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

export const metadata: Metadata = { title: "Cotizaciones" };

export default async function CotizacionesLayout({ children }: { children: React.ReactNode }) {
  await requireSection("cotizaciones");
  return children;
}

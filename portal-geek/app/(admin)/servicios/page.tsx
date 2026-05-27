import type { Metadata } from "next";

import { requireSection } from "@/lib/auth/page-guard";

import { ViewServicios } from "./view-servicio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Servicios | Geek Design" };

export default async function ServiciosPage() {
  await requireSection("servicios");

  return <ViewServicios />;
}

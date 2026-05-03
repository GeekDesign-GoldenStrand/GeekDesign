import type { Metadata } from "next";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";

import CotizacionesList from "./cotizaciones-list";

export const metadata: Metadata = { title: "Cotizaciones — Geek Design" };

export default function CotizacionesPage() {
  return (
    <div>
      <AdminHeader title="Cotizaciones" />
      <CotizacionesList />
    </div>
  );
}

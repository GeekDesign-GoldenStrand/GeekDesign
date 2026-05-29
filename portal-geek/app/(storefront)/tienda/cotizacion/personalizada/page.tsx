import type { Metadata } from "next";

import { EnConstruccion } from "@/components/storefront/organisms/EnConstruccion";

export const metadata: Metadata = { title: "Cotización personalizada" };

export default function CotizacionPersonalizadaPage() {
  return <EnConstruccion />;
}

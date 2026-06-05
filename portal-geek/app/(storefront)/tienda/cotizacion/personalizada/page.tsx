import type { Metadata } from "next";

import type { LeadField } from "@/components/storefront/organisms/SolicitudLeadForm";
import { SolicitudLeadForm } from "@/components/storefront/organisms/SolicitudLeadForm";

export const metadata: Metadata = { title: "Quiero algo específico" };

interface Props {
  // Optional catalog service this personalización started from (ST-12 catalog
  // path: a service's "Personalizar" button links here with ?servicio=ID).
  searchParams: Promise<{ servicio?: string }>;
}

// ST-12 — personalización: el cliente sabe EXACTAMENTE lo que quiere. Pedimos el
// mayor nivel de detalle (especificaciones, medidas exactas, materiales,
// acabados, cantidad) para una cotización precisa.
const FIELDS: LeadField[] = [
  {
    name: "especificaciones",
    kind: "textarea",
    label: "Especificaciones de tu solicitud",
    resumen: "Especificaciones",
    required: true,
    placeholder: "Describe con el mayor detalle posible lo que necesitas…",
    maxLength: 1500,
  },
  {
    name: "medidas",
    kind: "text",
    label: "Tamaño / medidas exactas",
    resumen: "Medidas",
    required: true,
    placeholder: "Ej. 30 x 40 cm, grosor 5 mm",
    maxLength: 120,
  },
  {
    name: "materiales",
    kind: "text",
    label: "Materiales deseados",
    resumen: "Materiales",
    placeholder: "Ej. acrílico, MDF, vinil…",
    maxLength: 200,
  },
  {
    name: "acabados",
    kind: "text",
    label: "Acabados",
    resumen: "Acabados",
    placeholder: "Ej. mate, brillante, pintado…",
    maxLength: 200,
  },
  {
    name: "cantidad",
    kind: "number",
    label: "Cantidad",
    resumen: "Cantidad",
    required: true,
    min: 1,
    placeholder: "Ej. 100",
  },
];

export default async function CotizacionPersonalizadaPage({ searchParams }: Props) {
  const { servicio } = await searchParams;
  const parsed = Number(servicio);
  const idServicio = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;

  return (
    <SolicitudLeadForm
      tipo="personalizada"
      titulo="Quiero algo específico"
      intro="Detalla tus especificaciones y el equipo de Geek Design te enviará una cotización personalizada. Podrás compartir archivos de referencia cuando te contactemos."
      fields={FIELDS}
      idServicio={idServicio}
    />
  );
}

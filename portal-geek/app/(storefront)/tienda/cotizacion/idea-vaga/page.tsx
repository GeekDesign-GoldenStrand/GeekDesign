import type { Metadata } from "next";

import type { LeadField } from "@/components/storefront/organisms/SolicitudLeadForm";
import { SolicitudLeadForm } from "@/components/storefront/organisms/SolicitudLeadForm";

export const metadata: Metadata = { title: "Tengo una idea" };

// ST-11 — idea vaga: el cliente YA tiene una idea. Pedimos un nivel medio de
// detalle (servicio + descripción + parámetros generales) para una cotización
// aproximada.
const FIELDS: LeadField[] = [
  {
    name: "tipo_servicio",
    kind: "select",
    label: "¿Qué tipo de servicio te interesa?",
    resumen: "Servicio deseado",
    required: true,
    options: [
      "Corte láser",
      "Grabado láser",
      "Bordado",
      "Impresión",
      "Diseño gráfico",
      "Aún no lo sé",
    ],
  },
  {
    name: "descripcion_idea",
    kind: "textarea",
    label: "Describe tu idea",
    resumen: "Idea",
    required: true,
    placeholder: "Cuéntanos qué tienes en mente: estilo, colores, para qué es…",
    maxLength: 1000,
  },
  {
    name: "cantidad",
    kind: "number",
    label: "Cantidad aproximada",
    resumen: "Cantidad aprox.",
    min: 1,
    placeholder: "Ej. 50",
  },
  {
    name: "medidas",
    kind: "text",
    label: "Medidas o tamaño aproximado",
    resumen: "Medidas aprox.",
    placeholder: "Ej. 30 x 40 cm",
    maxLength: 120,
  },
];

export default function IdeaVagaPage() {
  return (
    <SolicitudLeadForm
      tipo="idea_vaga"
      titulo="Tengo una idea"
      intro="Cuéntanos tu idea con el detalle que tengas y el equipo de Geek Design preparará una cotización aproximada."
      fields={FIELDS}
    />
  );
}

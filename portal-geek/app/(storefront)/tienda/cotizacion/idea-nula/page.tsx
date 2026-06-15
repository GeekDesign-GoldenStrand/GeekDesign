import type { Metadata } from "next";

import type { LeadField } from "@/components/storefront/organisms/SolicitudLeadForm";
import { SolicitudLeadForm } from "@/components/storefront/organisms/SolicitudLeadForm";

export const metadata: Metadata = { title: "No sé lo que quiero" };

// ST-10 — idea nula: el cliente NO sabe qué quiere. Pedimos lo mínimo y muy
// abierto (tipo de proyecto + objetivo) para que Dirección proponga opciones.
const FIELDS: LeadField[] = [
  {
    name: "tipo_proyecto",
    kind: "select",
    label: "¿Qué tipo de proyecto tienes en mente?",
    resumen: "Tipo de proyecto",
    required: true,
    options: [
      "No estoy seguro",
      "Señalización / letreros",
      "Regalo o promocional",
      "Decoración",
      "Identidad de marca",
      "Otro",
    ],
  },
  {
    name: "objetivo",
    kind: "textarea",
    label: "¿Qué te gustaría lograr?",
    resumen: "Objetivo",
    required: true,
    placeholder: "Para qué lo necesitas, qué te imaginas, a quién va dirigido…",
    maxLength: 1000,
  },
];

export default function IdeaNulaPage() {
  return (
    <SolicitudLeadForm
      tipo="idea_nula"
      titulo="No sé lo que quiero"
      intro="No te preocupes si aún no lo tienes claro. Cuéntanos lo básico y el equipo de Geek Design te propondrá opciones."
      fields={FIELDS}
    />
  );
}

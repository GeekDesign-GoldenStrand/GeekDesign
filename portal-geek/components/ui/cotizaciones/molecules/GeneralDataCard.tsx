import { ArrowSquareOut, FileText } from "@phosphor-icons/react";
import React from "react";

import { formatDate } from "@/lib/utils/date";
import type { EstatusCotizacion } from "@/types/cotizacion";

import { FieldRow } from "../atoms/FieldRow";
import { SectionCard } from "../atoms/SectionCard";
import { StatusBadge } from "../atoms/StatusBadge";

export interface GeneralDataCardData {
  folio: string | null;
  nombre_oportunidad: string | null;
  estatus_label: EstatusCotizacion;
  creado_por: string;
  fecha_fin: string | null;
  fecha_validacion: string | null;
  fecha_aprobacion: string | null;
  pdf_url: string | null;
}

interface GeneralDataCardProps {
  cotizacion: GeneralDataCardData;
}

export function GeneralDataCard({ cotizacion }: GeneralDataCardProps) {
  return (
    <SectionCard title="Datos generales" icon={<FileText size={15} />}>
      <FieldRow label="Folio" value={cotizacion.folio ?? "—"} />
      <FieldRow
        label="Nombre de oportunidad"
        value={
          <span className="font-normal text-gray-500">{cotizacion.nombre_oportunidad ?? "—"}</span>
        }
      />
      <FieldRow
        label="Estatus"
        value={<StatusBadge estatus={cotizacion.estatus_label} size="sm" />}
      />
      <FieldRow
        label="Creada por"
        value={<span className="font-normal text-gray-500">{cotizacion.creado_por || "—"}</span>}
      />
      <FieldRow
        label="Fecha entrega estimada"
        value={
          <span className="font-normal text-gray-500">
            {formatDate(cotizacion.fecha_fin ?? null)}
          </span>
        }
      />
      <FieldRow
        label="Fecha validación"
        value={
          <span className="font-normal text-gray-500">
            {formatDate(cotizacion.fecha_validacion ?? null)}
          </span>
        }
      />
      <FieldRow
        label="Fecha aprobación"
        value={
          <span className="font-normal text-gray-500">
            {formatDate(cotizacion.fecha_aprobacion ?? null)}
          </span>
        }
      />
      {cotizacion.pdf_url && (
        <FieldRow
          label="PDF"
          value={
            <a
              href={cotizacion.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-normal text-[13px] flex items-center gap-1"
            >
              Ver PDF <ArrowSquareOut size={13} />
            </a>
          }
          last
        />
      )}
    </SectionCard>
  );
}

import { ArrowSquareOut, FileText } from "@phosphor-icons/react";

import { formatDate } from "@/lib/utils/date";
import { type EstatusCotizacion, isEstatusCotizacion } from "@/types/cotizacion";
// estatus_label is the free-form catalog string (see StatusBadge). We
// keep the import out of this file to discourage callers from re-adding
// `as EstatusCotizacion` casts at the call site — the badge already
// handles off-catalog values gracefully.

import { FieldRow } from "../atoms/FieldRow";
import { SectionCard } from "../atoms/SectionCard";
import { StatusBadge } from "../atoms/StatusBadge";
import { StatusDropdown } from "../atoms/StatusDropdown";

export interface GeneralDataCardData {
  folio: string | null;
  nombre_oportunidad: string | null;
  estatus_label: string;
  creado_por: string;
  fecha_fin: string | null;
  fecha_validacion: string | null;
  fecha_aprobacion: string | null;
  pdf_url: string | null;
}

interface GeneralDataCardProps {
  cotizacion: GeneralDataCardData;
  /**
   * When BOTH are provided AND the current estatus is in the catalog, the
   * status field renders as an interactive dropdown. The parent owns the
   * confirm + PATCH flow — this card just surfaces the picker. Omit either
   * (or pass an empty options list) to keep the historical read-only badge.
   */
  statusOptions?: EstatusCotizacion[];
  onStatusChange?: (next: EstatusCotizacion) => void;
}

export function GeneralDataCard({
  cotizacion,
  statusOptions,
  onStatusChange,
}: GeneralDataCardProps) {
  // Only swap to the dropdown when (a) callers opted in by passing a handler,
  // (b) the current value is a recognised catalog entry, AND (c) there's at
  // least one legal next state to offer — otherwise fall back to the badge,
  // which already tolerates off-catalog strings.
  const currentEstatus = isEstatusCotizacion(cotizacion.estatus_label)
    ? cotizacion.estatus_label
    : null;
  const renderInteractive =
    onStatusChange !== undefined && currentEstatus !== null && (statusOptions?.length ?? 0) > 0;

  return (
    <SectionCard title="Datos generales" icon={<FileText size={15} />}>
      <FieldRow label="Folio" value={cotizacion.folio ?? "—"} />
      <FieldRow
        label="Nombre de oportunidad"
        value={
          <span className="font-normal text-gray-700">{cotizacion.nombre_oportunidad ?? "—"}</span>
        }
      />
      <FieldRow
        label="Estatus"
        value={
          renderInteractive && currentEstatus && onStatusChange ? (
            <StatusDropdown
              current={currentEstatus}
              options={statusOptions ?? []}
              onChange={onStatusChange}
            />
          ) : (
            <StatusBadge estatus={cotizacion.estatus_label} size="sm" />
          )
        }
      />
      <FieldRow
        label="Creada por"
        value={<span className="font-normal text-gray-700">{cotizacion.creado_por || "—"}</span>}
      />
      <FieldRow
        label="Fecha entrega estimada"
        value={
          <span className="font-normal text-gray-700">
            {formatDate(cotizacion.fecha_fin ?? null)}
          </span>
        }
      />
      <FieldRow
        label="Fecha validación"
        value={
          <span className="font-normal text-gray-700">
            {formatDate(cotizacion.fecha_validacion ?? null)}
          </span>
        }
      />
      <FieldRow
        label="Fecha aprobación"
        value={
          <span className="font-normal text-gray-700">
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

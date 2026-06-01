import { ArrowLeft, PencilSimple, Tag } from "@phosphor-icons/react";
import Link from "next/link";
import React from "react";

import { Button } from "../atoms/Button";

interface CotizacionHeaderProps {
  folio?: string | null;
  nombreOportunidad?: string | null;
  discountApplied?: boolean;
  // When false, the "Editar" CTA is hidden. The server only accepts edits
  // while the cotización is in 'Pendiente'; once the cliente has validated
  // (or beyond), showing the button just leads to a 409 on save.
  canEdit?: boolean;
  // When false, the "Agregar descuento" CTA is hidden. Same Pendiente-only
  // rule as `canEdit` (see aplicarDescuento in lib/services/cotizaciones.ts).
  canAddDiscount?: boolean;
  backHref?: string;
  onEdit: () => void;
  onDiscount: () => void;
}

export function CotizacionHeader({
  folio,
  nombreOportunidad,
  discountApplied = false,
  canEdit = true,
  canAddDiscount = true,
  backHref = "/cotizaciones",
  onEdit,
  onDiscount,
}: CotizacionHeaderProps) {
  return (
    <div className="flex justify-between items-start gap-4 flex-wrap mb-6">
      <div className="flex flex-col gap-3 min-w-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 p-2 w-fit text-[13px] shadow-sm rounded-[7px] border border-red-300 font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Regresar
        </Link>

        <div className="min-w-0">
          <p className="text-[11px] text-gray-300 uppercase tracking-widest mb-1">Cotización</p>
          <h1 className="text-[22px] font-medium text-gray-900 leading-tight break-words">
            {folio ?? "Sin folio"}
          </h1>
          {nombreOportunidad && (
            <p className="text-[13px] text-gray-500 mt-1.5 leading-tight break-words">
              {nombreOportunidad}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex flex-wrap gap-2">
          {!discountApplied && canAddDiscount && (
            <Button
              onClick={onDiscount}
              icon={<Tag size={15} />}
              className="border-dashed border-gray-400 rounded-[7px] p-2 text-[#1e1e1e] hover:bg-amber-100 shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-colors"
            >
              Agregar descuento
            </Button>
          )}
          {canEdit && (
            <Button
              variant="default"
              onClick={onEdit}
              icon={<PencilSimple size={15} />}
              className="border-dashed border-gray-400 rounded-[7px] p-2 text-[#1e1e1e] hover:bg-amber-100 shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-colors"
            >
              Editar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

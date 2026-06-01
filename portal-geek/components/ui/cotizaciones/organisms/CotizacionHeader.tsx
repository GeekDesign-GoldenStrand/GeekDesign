import { ArrowLeft, PencilSimple, Tag } from "@phosphor-icons/react";
import Link from "next/link";
import React from "react";

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
    <div className="mb-6">
      <div className="flex justify-between items-center gap-4 flex-wrap mb-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 h-9 px-3 w-fit text-[13px] shadow-sm rounded-[7px] border border-red-300 bg-red-50 font-medium text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Regresar
        </Link>

        <div className="flex items-center gap-2">
          {!discountApplied && canAddDiscount && (
            <button
              type="button"
              onClick={onDiscount}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium border border-gray-200 bg-white shadow-sm text-gray-800 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <Tag size={15} />
              Agregar descuento
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium border border-gray-200 bg-white shadow-sm text-gray-800 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <PencilSimple size={15} />
              Editar
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-[11px] text-gray-600 uppercase tracking-widest mb-1">Cotización</p>
        <h1 className="text-[22px] font-medium text-gray-900 leading-none">
          {nombreOportunidad ?? "Sin nombre"}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1.5 leading-tight">{folio ?? "Sin folio"}</p>
      </div>
    </div>
  );
}

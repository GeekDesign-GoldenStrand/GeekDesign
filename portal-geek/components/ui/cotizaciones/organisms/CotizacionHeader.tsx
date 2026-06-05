import { ArrowLeft, PencilSimple } from "@phosphor-icons/react";
import Link from "next/link";
import React from "react";

interface CotizacionHeaderProps {
  folio?: string | null;
  nombreOportunidad?: string | null;
  // When false, the "Editar" CTA is hidden. The server only accepts edits
  // while the cotización is in 'Pendiente'; once the cliente has validated
  // (or beyond), showing the button just leads to a 409 on save.
  canEdit?: boolean;
  backHref?: string;
  onEdit: () => void;
}

export function CotizacionHeader({
  folio,
  nombreOportunidad,
  canEdit = true,
  backHref = "/cotizaciones",
  onEdit,
}: CotizacionHeaderProps) {
  return (
    <div className="flex justify-between items-start gap-4 flex-wrap mb-6">
      <div className="flex flex-col gap-3 min-w-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 h-9 px-3 w-fit text-[13px] shadow-sm rounded-[7px] border border-red-300 bg-red-50 font-medium text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Regresar
        </Link>

        <div className="min-w-0">
          <p className="text-[11px] text-gray-600 uppercase tracking-widest mb-1">Cotización</p>
          <h1 className="text-[22px] font-medium text-gray-900 leading-none">
            {nombreOportunidad ?? "Sin nombre"}
          </h1>
          <p className="text-[13px] text-gray-500 mt-1.5 leading-tight">{folio ?? "Sin folio"}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex flex-wrap gap-2">
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
    </div>
  );
}

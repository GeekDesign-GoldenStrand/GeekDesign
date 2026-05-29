"use client";

import { ArrowLeft, CircleNotch, FilePdf, PencilSimple } from "@phosphor-icons/react";
import Link from "next/link";

interface PedidoHeaderProps {
  title: string;
  onEdit: () => void;
  backHref?: string;
  canGenerateOC?: boolean;
  ocLoading?: boolean;
  onGenerarOC?: () => void;
}

export function PedidoHeader({
  title,
  onEdit,
  backHref = "/pedidos",
  canGenerateOC = false,
  ocLoading = false,
  onGenerarOC,
}: PedidoHeaderProps) {
  return (
    <div className="flex justify-between items-start gap-4 flex-wrap mb-6">
      <div className="flex flex-col gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 p-2 w-fit text-[13px] shadow-sm rounded-[7px] border border-red-300 font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Regresar
        </Link>
        <div>
          <p className="text-[11px] text-gray-300 uppercase tracking-widest mb-1">Pedido</p>
          <h1 className="text-[22px] font-medium text-gray-900 leading-none">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-8">
        {canGenerateOC && onGenerarOC && (
          <button
            type="button"
            onClick={onGenerarOC}
            disabled={ocLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium border border-gray-200 bg-transparent text-gray-800 hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            {ocLoading ? <CircleNotch size={15} className="animate-spin" /> : <FilePdf size={15} />}
            {ocLoading ? "Generando…" : "Generar OC"}
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium border border-gray-200 bg-transparent text-gray-800 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <PencilSimple size={15} />
          Editar
        </button>
      </div>
    </div>
  );
}

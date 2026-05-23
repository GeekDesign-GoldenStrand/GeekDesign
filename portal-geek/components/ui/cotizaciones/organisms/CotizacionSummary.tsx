"use client";

import { Info, Tag, Trash } from "@phosphor-icons/react";
import React, { useState } from "react";

import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import type { LineItem } from "@/lib/utils/cotizacion";
import { formatDate } from "@/lib/utils/date";

function fmt(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function joinSpanish(items: string[]): string {
  if (items.length === 0) return "—";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

interface CotizacionSummaryProps {
  montoTotal: number;
  porcentajeDescuento?: number | null;
  motivoDescuento?: string | null;
  fechaCreacion: string;
  fechaEntrega?: string | null;
  servicios: LineItem[];
  onDeleteDiscount?: () => void;
}

const CARD_CLASS =
  "bg-white rounded-[7px] border border-gray-100 shadow-[4px_4px_7px_0_rgba(0,0,0,0.1)] flex flex-col min-h-[158px] overflow-hidden";

export const CotizacionSummary: React.FC<CotizacionSummaryProps> = ({
  montoTotal,
  porcentajeDescuento,
  motivoDescuento,
  fechaCreacion,
  fechaEntrega,
  servicios,
  onDeleteDiscount,
}) => {
  const [motivoModalOpen, setMotivoModalOpen] = useState(false);

  const descuento = porcentajeDescuento ?? 0;
  const hasDescuento = descuento > 0;
  const motivo = motivoDescuento?.trim() || null;

  const uniqueServiceNames = Array.from(new Set(servicios.map((s) => s.nombre_servicio)));
  const serviciosResumen = joinSpanish(uniqueServiceNames);

  return (
    <>
      {/* Motivo modal */}
      {motivo && motivoModalOpen && (
        <ModalShell title="Motivo del descuento" onClose={() => setMotivoModalOpen(false)}>
          <p className="text-[14px] text-gray-700 leading-relaxed">{motivo}</p>
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setMotivoModalOpen(false)}
              className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </ModalShell>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* ── Monto total ──────────────────────── */}
        <div className={CARD_CLASS}>
          <div className="flex-1 px-6 pt-4">
            <p className="text-[20px] text-gray-500 leading-none">Monto total</p>
            <p className="mt-3 text-[30px] font-medium text-black leading-tight">
              {fmt(montoTotal)}
            </p>
          </div>
          {hasDescuento && (
            <div className="bg-slate-100 h-[53px] px-5 flex items-center gap-3">
              <Tag size={22} className="text-[#1E1E1E]" />
              <span className="text-[16px] font-medium text-[#1E1E1E]">
                Descuento {Math.round(descuento)}%
              </span>
              <div className="ml-auto flex items-center gap-2">
                {motivo && (
                  <button
                    type="button"
                    onClick={() => setMotivoModalOpen(true)}
                    aria-label="Mostrar motivo del descuento"
                    className="inline-flex items-center text-[#1E1E1E]/60 hover:text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-blue-200 rounded transition-colors"
                  >
                    <Info size={18} />
                  </button>
                )}
                {onDeleteDiscount && (
                  <button
                    type="button"
                    onClick={onDeleteDiscount}
                    aria-label="Eliminar descuento"
                    className="inline-flex items-center text-[#A32D2D]/70 hover:text-[#A32D2D] focus:outline-none focus:ring-2 focus:ring-red-200 rounded transition-colors"
                  >
                    <Trash size={18} />
                  </button>
                )}
              </div>
            </div>
          )}
          {!hasDescuento && <p className="px-6 pb-4 text-[15px] text-gray-500">Sin descuento</p>}
        </div>

        {/* ── Fecha de entrega ─────────────────── */}
        <div className={CARD_CLASS}>
          <div className="flex-1 px-6 pt-4">
            <p className="text-[20px] text-gray-500 leading-none">Fecha de entrega</p>
            <p className="mt-3 text-[30px] font-medium text-black leading-tight">
              {formatDate(fechaEntrega)}
            </p>
          </div>
          <p className="px-6 pb-4 text-[15px] text-gray-500">
            Creada el {formatDate(fechaCreacion)}
          </p>
        </div>

        {/* ── Servicios ────────────────────────── */}
        <div className={CARD_CLASS}>
          <div className="flex-1 px-6 pt-4">
            <p className="text-[20px] text-gray-500 leading-none">Servicios</p>
            <p className="mt-3 text-[30px] font-medium text-black leading-tight">
              {servicios.length}
            </p>
          </div>
          <p className="px-6 pb-4 text-[15px] text-gray-500" title={serviciosResumen}>
            {serviciosResumen}
          </p>
        </div>
      </div>
    </>
  );
};

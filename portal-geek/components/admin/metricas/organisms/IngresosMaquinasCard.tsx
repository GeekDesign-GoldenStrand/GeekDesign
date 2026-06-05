"use client";

import { Wrench } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { formatCurrency } from "../utils";

export interface IngresosMaquinaRow {
  id_maquina: number;
  nombre: string;
  apodo: string | null;
  tipo: string | null;
  monto: number;
  numPedidos: number;
}

interface Props {
  rows: IngresosMaquinaRow[];
  totalScope: number;
  subtitle: string;
  controls: ReactNode;
}

// Podium colors for the first three positions; the rest fall back to neutral.
const RANK_STYLES: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-700 border-yellow-300",
  1: "bg-gray-100 text-gray-600 border-gray-300",
  2: "bg-orange-100 text-orange-700 border-orange-300",
};

export function IngresosMaquinasCard({ rows, totalScope, subtitle, controls }: Props) {
  // Bars are sized relative to the leader so #1 always fills the track.
  const maxMonto = rows.length > 0 ? rows[0].monto : 0;

  return (
    <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-8 gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <Wrench size={22} weight="fill" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Ingresos por Máquina</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">{controls}</div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
          <p className="text-gray-500 text-sm">
            No hay ingresos atribuibles a máquinas para el periodo seleccionado.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((m, i) => {
            const pct = maxMonto > 0 ? (m.monto / maxMonto) * 100 : 0;
            const share = totalScope > 0 ? (m.monto / totalScope) * 100 : 0;
            return (
              <li
                key={m.id_maquina}
                className="flex items-center gap-3 sm:gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold ${
                    RANK_STYLES[i] ?? "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{m.nombre}</p>
                    {m.tipo && (
                      <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {m.tipo}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {m.apodo ? `${m.apodo} · ` : ""}
                    {m.numPedidos} {m.numPedidos === 1 ? "pedido" : "pedidos"} · {share.toFixed(1)}%
                    del total
                  </p>
                  <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <p className="flex-shrink-0 font-extrabold text-gray-900 text-sm sm:text-base tabular-nums">
                  {formatCurrency(m.monto)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

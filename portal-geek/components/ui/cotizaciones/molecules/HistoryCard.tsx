import { ArrowRight, Clock } from "@phosphor-icons/react";
import React from "react";

import type { HistorialEstado } from "@/lib/utils/cotizacion";

import { USERS } from "@/lib/utils/cotizacion";

import { formatDate } from "@/lib/utils/date";

import { SectionCard } from "../atoms/SectionCard";

interface HistoryCardProps {
  historial: HistorialEstado[];
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ historial }) => (
  <SectionCard title="Historial de estatus" icon={<Clock size={15} />}>
    {historial.map((entry, i) => {
      const isFirst = entry.id_estado_anterior == null;
      return (
        <div
          key={entry.id_historial}
          className={`flex gap-3 py-2.5 text-[13px] ${
            i < historial.length - 1 ? "border-b border-gray-100" : ""
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              isFirst ? "bg-gray-300" : "bg-[#9FE1CB]"
            }`}
          />
          <div>
            <p className="font-medium text-gray-900 leading-tight">
              {isFirst ? (
                entry.estado_nuevo_label
              ) : (
                <>
                  {entry.estado_anterior_label}
                  <ArrowRight size={12} className="inline mx-1.5 text-gray-300" />
                  {entry.estado_nuevo_label}
                </>
              )}
            </p>
            <p className="text-gray-400 mt-0.5 flex items-center gap-1.5">
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${USERS[entry.actor_tipo]}`}
              >
                {entry.actor_tipo}
              </span>
              {entry.usuario_nombre} · {formatDate(entry.fecha_cambio)}
            </p>
          </div>
        </div>
      );
    })}
  </SectionCard>
);

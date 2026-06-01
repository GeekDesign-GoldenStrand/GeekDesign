import { ArrowRight, Clock } from "@phosphor-icons/react";

import { formatDate } from "@/lib/utils/date";
import type { HistorialEstado } from "@/types/cotizacion";

import { USERS } from "../atoms/constants";
import { SectionCard } from "../atoms/SectionCard";

interface HistoryCardProps {
  historial: HistorialEstado[];
}

export function HistoryCard({ historial }: HistoryCardProps) {
  return (
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
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 leading-tight break-words">
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
              <p className="text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${USERS[entry.actor_tipo]}`}
                >
                  {entry.actor_tipo}
                </span>
                <span className="break-words min-w-0">
                  {entry.usuario_nombre} · {formatDate(entry.fecha_cambio)}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </SectionCard>
  );
}

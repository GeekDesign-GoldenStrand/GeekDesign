import { ClockCounterClockwise } from "@phosphor-icons/react";

import { SectionCard } from "@/components/ui/cotizaciones/atoms/SectionCard";
import { formatDate } from "@/lib/utils/date";
import type { PedidoHistorialEntry } from "@/types/pedido";

interface Props {
  historial: PedidoHistorialEntry[];
}

export function PedidoHistorialCard({ historial }: Props) {
  return (
    <SectionCard title="Historial de estatus" icon={<ClockCounterClockwise size={15} />}>
      {historial.length === 0 ? (
        <p className="text-[14px] text-gray-600">Sin cambios registrados.</p>
      ) : (
        <ul className="space-y-3">
          {historial.map((entry, i) => (
            <li key={i} className="flex items-start gap-3 text-[14px]">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 translate-y-1.5" />
              <div>
                <p className="text-gray-700">
                  {entry.estatus_anterior ? (
                    <>
                      <span className="font-medium">{entry.estatus_anterior}</span>
                      <span className="text-gray-400 mx-1">→</span>
                    </>
                  ) : null}
                  <span className="font-medium">{entry.estatus_nuevo}</span>
                </p>
                <p className="text-[13px] text-gray-600 mt-0.5">
                  {formatDate(entry.fecha_cambio)} · {entry.cambiado_por}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

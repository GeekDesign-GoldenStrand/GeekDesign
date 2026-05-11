import { ArrowRight } from "@phosphor-icons/react";

import { fmtDate } from "@/components/ui/pedidos/format";
import type { HistorialEntry } from "@/components/ui/pedidos/types";

export function HistorialTab({ historial }: { historial: HistorialEntry[] }) {
  if (historial.length === 0) {
    return (
      <p className="py-12 text-center font-ibm-plex text-[14px] text-[#8e908f]">
        Sin historial registrado.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {historial.map((h) => (
        <div
          key={h.id_historial}
          className="flex items-center justify-between rounded-[8px] border border-[#e8e8e8] px-4 py-3"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-ibm-plex text-[13px] text-[#8e908f]">
                {h.estadoAnterior?.descripcion.replace("_", " ") ?? "Inicio"}
              </span>
              <ArrowRight size={13} className="text-[#8e908f]" aria-hidden />
              <span className="font-ibm-plex text-[13px] font-semibold text-[#1e1e1e]">
                {h.estadoNuevo.descripcion.replace("_", " ")}
              </span>
            </div>
            {h.id_estatus_pedido && (
              <p className="mt-0.5 font-ibm-plex text-[12px] text-[#8e908f]">
                Subproceso: {h.id_estatus_pedido}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-ibm-plex text-[12px] text-[#555]">{h.usuario.nombre_completo}</p>
            <p className="font-ibm-plex text-[11px] text-[#8e908f]">{fmtDate(h.fecha_cambio)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

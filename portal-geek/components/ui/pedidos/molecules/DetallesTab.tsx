import { fmtMoney } from "@/components/ui/pedidos/format";
import type { DetallePedido } from "@/components/ui/pedidos/types";

export function DetallesTab({ detalles }: { detalles: DetallePedido[] }) {
  if (detalles.length === 0) {
    return (
      <p className="py-12 text-center font-ibm-plex text-[14px] text-[#8e908f]">
        Sin detalles registrados.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {detalles.map((d) => (
        <div key={d.id_detalle} className="rounded-[8px] border border-[#e8e8e8] p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-ibm-plex text-[14px] font-semibold text-[#1e1e1e]">
                {d.servicio.nombre_servicio}
              </p>
              <p className="font-ibm-plex text-[12px] text-[#8e908f]">
                {d.material.nombre_material}
              </p>
            </div>
            <div className="text-right">
              <p className="font-ibm-plex text-[14px] font-semibold text-[#1e1e1e]">
                {fmtMoney(d.subtotal)}
              </p>
              <p className="font-ibm-plex text-[12px] text-[#8e908f]">
                {fmtMoney(d.precio_unitario)} × {d.cantidad}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-[#f0f0f0] pt-3 font-ibm-plex text-[12px] text-[#555]">
            {d.ancho_cm && <span>Ancho: {d.ancho_cm} cm</span>}
            {d.alto_cm && <span>Alto: {d.alto_cm} cm</span>}
            {d.grosor_cm && <span>Grosor: {d.grosor_cm} cm</span>}
            {d.color && <span>Color: {d.color}</span>}
            <span>Responsable: {d.responsable_recoleccion}</span>
          </div>
          {d.notas && (
            <p className="mt-2 font-ibm-plex text-[12px] text-[#8e908f]">Notas: {d.notas}</p>
          )}
          <a
            href={d.archivo.url_archivo}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 font-ibm-plex text-[12px] text-[#006aff] hover:underline"
          >
            {d.archivo.nombre_archivo} ↗
          </a>
        </div>
      ))}
    </div>
  );
}

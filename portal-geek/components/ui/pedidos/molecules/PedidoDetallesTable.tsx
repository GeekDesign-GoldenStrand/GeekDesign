import { Table } from "@phosphor-icons/react";

import { SectionCard } from "@/components/ui/cotizaciones/atoms/SectionCard";
import type { PedidoLineItem } from "@/types/pedido";

function money(value: string) {
  return `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

interface Props {
  detalle: PedidoLineItem[];
}

export function PedidoDetallesTable({ detalle }: Props) {
  const total = detalle.reduce((acc, d) => acc + Number(d.subtotal), 0);

  return (
    <SectionCard title="Detalle del pedido" icon={<Table size={15} />}>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr>
              {["Servicio", "Material", "Cant.", "Dimensiones", "P. Unitario", "Subtotal"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-[11px] font-medium text-gray-400 uppercase tracking-wider pb-2 text-left border-b border-gray-100 px-2 last:text-right"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {detalle.map((item) => {
              const dims = [
                item.ancho_cm ? `${item.ancho_cm} cm` : null,
                item.alto_cm ? `× ${item.alto_cm} cm` : null,
                item.grosor_cm ? `× ${item.grosor_cm} cm` : null,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <tr key={item.id_detalle} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-2">
                    <p className="font-medium text-gray-900">{item.servicio.nombre_servicio}</p>
                    {item.color && <p className="text-[12px] text-gray-400">Color: {item.color}</p>}
                    {item.notas && <p className="text-[12px] text-gray-400 italic">{item.notas}</p>}
                  </td>
                  <td className="py-3 px-2 text-gray-500">{item.material.nombre_material}</td>
                  <td className="py-3 px-2 text-gray-700">{item.cantidad}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{dims || "—"}</td>
                  <td className="py-3 px-2 text-gray-700">{money(item.precio_unitario)}</td>
                  <td className="py-3 px-2 text-right font-medium text-gray-900">
                    {money(item.subtotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <div className="text-[14px] flex gap-6">
          <span className="text-gray-500">Total</span>
          <span className="font-semibold text-gray-900 min-w-[110px] text-right">
            {`$${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

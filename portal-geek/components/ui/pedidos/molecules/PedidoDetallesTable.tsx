import { Table } from "@phosphor-icons/react";

import { SectionCard } from "@/components/ui/cotizaciones/atoms/SectionCard";
import type { PedidoLineItem } from "@/types/pedido";

function money(value: string) {
  return `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

interface Props {
  detalle: PedidoLineItem[];
  detalleIds?: number[] | null;
}

export function PedidoDetallesTable({ detalle, detalleIds }: Props) {
  const idSet = detalleIds ? new Set(detalleIds) : null;
  const items = idSet ? detalle.filter((d) => idSet.has(d.id_detalle)) : detalle;
  const total = items.reduce((acc, d) => acc + Number(d.subtotal), 0);

  const serviceName = idSet ? (items[0]?.servicio.nombre_servicio ?? null) : null;

  return (
    <SectionCard title="Detalle del pedido" icon={<Table size={15} />}>
      {serviceName && (
        <p className="mb-3 text-[12px] text-gray-500">
          Servicio: <span className="font-semibold text-gray-700">{serviceName}</span>
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr>
              {["Servicio", "Material", "Cant.", "Especificaciones", "P. Unitario", "Subtotal"].map(
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
            {items.map((item) => {
              const vars = item.variablesCotizacion ?? [];

              // Fixed-field fallback shown only when variablesCotizacion is empty
              const fixedDimParts: string[] = [];
              if (item.ancho_cm || item.alto_cm || item.grosor_cm) {
                fixedDimParts.push(
                  [
                    item.ancho_cm ? `${item.ancho_cm} cm` : null,
                    item.alto_cm ? `× ${item.alto_cm} cm` : null,
                    item.grosor_cm ? `× ${item.grosor_cm} cm` : null,
                  ]
                    .filter(Boolean)
                    .join(" ")
                );
              }
              if (item.color) fixedDimParts.push(`Color: ${item.color}`);

              return (
                <tr key={item.id_detalle} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-2">
                    <p className="font-medium text-gray-900">{item.servicio.nombre_servicio}</p>
                    {item.notas && (
                      <p className="text-[12px] text-gray-400 italic mt-0.5">{item.notas}</p>
                    )}
                  </td>
                  <td className="py-3 px-2 text-gray-500">{item.material.nombre_material}</td>
                  <td className="py-3 px-2 text-gray-700">{item.cantidad}</td>
                  <td className="py-3 px-2 text-gray-500 align-top">
                    {vars.length > 0 ? (
                      <dl className="space-y-0.5">
                        {vars.map((v) => (
                          <div key={v.id_variable} className="flex gap-1 text-[12px]">
                            <dt className="text-gray-400 whitespace-nowrap">
                              {v.variable.etiqueta}:
                            </dt>
                            <dd className="text-gray-700">
                              {String(v.valor ?? "—")}
                              {v.variable.unidad ? ` ${v.variable.unidad}` : ""}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : fixedDimParts.length > 0 ? (
                      <dl className="space-y-0.5">
                        {fixedDimParts.map((part) => (
                          <dd key={part} className="text-[12px] text-gray-700">
                            {part}
                          </dd>
                        ))}
                      </dl>
                    ) : (
                      "—"
                    )}
                  </td>
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

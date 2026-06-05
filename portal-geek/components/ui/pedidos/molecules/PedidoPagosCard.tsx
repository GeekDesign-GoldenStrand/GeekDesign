import { CurrencyCircleDollar } from "@phosphor-icons/react";

import { SectionCard } from "@/components/ui/cotizaciones/atoms/SectionCard";
import { formatDate } from "@/lib/utils/date";
import type { PedidoPago } from "@/types/pedido";

function money(value: string) {
  return `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;
}

interface Props {
  pagos: PedidoPago[];
}

export function PedidoPagosCard({ pagos }: Props) {
  if (pagos.length === 0) {
    return (
      <SectionCard title="Pagos" icon={<CurrencyCircleDollar size={15} />}>
        <p className="text-[14px] text-gray-600">Sin pagos registrados.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Pagos" icon={<CurrencyCircleDollar size={15} />}>
      <table className="w-full text-[14px] border-collapse">
        <thead>
          <tr>
            {["Fecha", "Monto", "Método", "Estatus"].map((h) => (
              <th
                key={h}
                className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider pb-2 text-left border-b border-gray-100 px-1"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagos.map((p) => (
            <tr key={p.id_pago} className="border-b border-gray-100 last:border-0">
              <td className="py-2 px-1 text-gray-700">{formatDate(p.fecha)}</td>
              <td className="py-2 px-1 font-medium text-gray-900">{money(p.monto_pago)}</td>
              <td className="py-2 px-1 text-gray-700">{p.metodo_pago}</td>
              <td className="py-2 px-1 text-gray-700">{p.estatus_pago}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}

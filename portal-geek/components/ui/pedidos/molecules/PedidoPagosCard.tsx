import { ArrowUUpLeft, CurrencyCircleDollar, Plus } from "@phosphor-icons/react";

import { SectionCard } from "@/components/ui/cotizaciones/atoms/SectionCard";
import { formatDate } from "@/lib/utils/date";
import type { PedidoPago } from "@/types/pedido";

function money(value: string) {
  return `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;
}

interface Props {
  pagos: PedidoPago[];
  /** When provided, renders a "Registrar pago" action in the section. */
  onRegister?: () => void;
  /** When provided (order fully paid), renders a "Solicitar reembolso" action. */
  onRefund?: () => void;
  /** When set, registering is blocked: show this reason instead of the button. */
  disabledReason?: string | null;
}

function RegisterButton({ onRegister }: { onRegister: () => void }) {
  return (
    <button
      type="button"
      onClick={onRegister}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e42200] hover:text-[#b81b00] transition-colors"
    >
      <Plus size={15} weight="bold" />
      Registrar pago
    </button>
  );
}

function RefundButton({ onRefund }: { onRefund: () => void }) {
  return (
    <button
      type="button"
      onClick={onRefund}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-600 hover:text-[#e42200] transition-colors"
    >
      <ArrowUUpLeft size={15} weight="bold" />
      Solicitar reembolso
    </button>
  );
}

// Picks the action shown next to the payments: refund (fully paid), the
// blocked-reason note, the register button, or nothing.
function PagoAction({
  onRegister,
  onRefund,
  disabledReason,
}: {
  onRegister?: () => void;
  onRefund?: () => void;
  disabledReason?: string | null;
}) {
  if (onRefund) return <RefundButton onRefund={onRefund} />;
  if (!onRegister) return null;
  if (disabledReason) {
    return <p className="text-[12px] font-medium text-gray-400">{disabledReason}</p>;
  }
  return <RegisterButton onRegister={onRegister} />;
}

export function PedidoPagosCard({ pagos, onRegister, onRefund, disabledReason }: Props) {
  if (pagos.length === 0) {
    return (
      <SectionCard title="Pagos" icon={<CurrencyCircleDollar size={15} />}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[14px] text-gray-600">Sin pagos registrados.</p>
          <PagoAction onRegister={onRegister} onRefund={onRefund} disabledReason={disabledReason} />
        </div>
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
      {(onRegister || onRefund) && (
        <div className="mt-4 flex justify-end">
          <PagoAction onRegister={onRegister} onRefund={onRefund} disabledReason={disabledReason} />
        </div>
      )}
    </SectionCard>
  );
}

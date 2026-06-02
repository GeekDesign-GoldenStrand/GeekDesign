import { CurrencyCircleDollar, Wrench } from "@phosphor-icons/react";

import { SectionCard } from "@/components/ui/cotizaciones/atoms/SectionCard";
import type { PedidoPago } from "@/types/pedido";

interface Props {
  // Kept for future API stability — the parent passes whatever getPedido
  // returns. Today the section shows an "en construcción" placeholder until
  // the pagos backend lands; reintroduce the table once createPago/listPagos
  // are implemented.
  pagos: PedidoPago[];
}

export function PedidoPagosCard(_props: Props) {
  return (
    <SectionCard title="Pagos" icon={<CurrencyCircleDollar size={15} />}>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ffecec] text-[#e42200]">
          <Wrench size={28} weight="duotone" aria-hidden />
        </div>
        <p className="mt-3 text-[14px] font-semibold text-[#1e1e1e]">En construcción</p>
        <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-[#575757]">
          El registro de pagos estará disponible pronto.
        </p>
      </div>
    </SectionCard>
  );
}

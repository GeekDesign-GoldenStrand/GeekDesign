"use client";

import { useRouter } from "next/navigation";

import type { PedidoParaFacturar } from "@/lib/services/finanzas";

const COLS = "1fr 1.5fr 1fr 1fr";

function getStatusStyle(status: string) {
  switch (status) {
    case "Pendiente":
      return "bg-[#F7B9FF]/70 text-[#D83CFF]";
    case "Validada":
      return "bg-[#B9EAFF] text-[#0D7794]";
    case "Rechazada":
      return "bg-[#FFA5A5]/60 text-[#FF3030]";
    case "Aprobada":
      return "bg-[#CCFFA5]/60 text-[#26AF00]";
    case "Cancelada":
      return "bg-[#B1B1B1] text-black";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

interface Props {
  pedidos: PedidoParaFacturar[];
}

export function FacturacionTemplate({ pedidos }: Props) {
  const router = useRouter();

  return (
    <section className="max-w-337.5 mx-auto px-4 md:px-6 pt-5 space-y-4">
      <div className="bg-transparent md:bg-white rounded">
        <div className="space-y-4 md:space-y-2">
          {/* Header — desktop only */}
          <div
            className="hidden md:grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
            style={{ gridTemplateColumns: COLS }}
          >
            <span className="whitespace-nowrap">Folio</span>
            <span className="whitespace-nowrap">Cliente</span>
            <span className="whitespace-nowrap">Tipo de persona</span>
            <span className="whitespace-nowrap">Estatus cotización</span>
          </div>

          {pedidos.length === 0 && (
            <div className="flex justify-center py-16 text-gray-500 text-sm">
              No hay pedidos con solicitud de factura.
            </div>
          )}

          {pedidos.map((p) => {
            const cot = p.cotizaciones[0];
            const folio = cot?.folio ?? `#${p.id_pedido}`;
            const estatus = cot?.estatus?.descripcion ?? "—";
            const tipoPersona = p.datos_facturacion?.tipo_persona;
            const tipoLabel =
              tipoPersona === "Fisica" ? "Física" : tipoPersona === "Moral" ? "Moral" : "—";

            return (
              <div key={p.id_pedido}>
                {/* Desktop row */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/finanzas/${p.id_pedido}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/finanzas/${p.id_pedido}`);
                    }
                  }}
                  aria-label={`Ver detalle de facturación del pedido ${folio}`}
                  className="hidden md:grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
                  style={{ gridTemplateColumns: COLS }}
                >
                  <span className="whitespace-nowrap font-medium">{folio}</span>
                  <div className="truncate px-2 min-w-0">
                    <span className="font-medium">{p.cliente.nombre_cliente}</span>
                    {p.cliente.empresa && (
                      <span className="block text-[12px] text-[#8e908f]">{p.cliente.empresa}</span>
                    )}
                  </div>
                  <span className="whitespace-nowrap">{tipoLabel}</span>
                  <div className="flex justify-center">
                    <span
                      className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getStatusStyle(estatus)}`}
                    >
                      {estatus}
                    </span>
                  </div>
                </div>

                {/* Mobile card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/finanzas/${p.id_pedido}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/finanzas/${p.id_pedido}`);
                    }
                  }}
                  className="md:hidden bg-white p-5 rounded-xl shadow-sm border border-[#F0F0F0] space-y-3 cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                        Folio
                      </p>
                      <p className="text-[16px] font-bold text-[#1e1e1e]">{folio}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${getStatusStyle(estatus)}`}
                    >
                      {estatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F5F5F5]">
                    <div>
                      <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                        Cliente
                      </p>
                      <p className="text-[13px] font-medium text-[#1e1e1e]">
                        {p.cliente.nombre_cliente}
                      </p>
                      {p.cliente.empresa && (
                        <p className="text-[11px] text-[#8e908f]">{p.cliente.empresa}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                        Tipo de persona
                      </p>
                      <p className="text-[13px] font-medium text-[#1e1e1e]">{tipoLabel}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

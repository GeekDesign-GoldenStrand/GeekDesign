"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SearchBar } from "@/components/admin/molecules/SearchBar";
import { FacturacionFilterSidebar } from "@/components/admin/organisms/FacturacionFilterSidebar";
import { FilterIcon } from "@/components/ui/atoms/icons";
import type { PedidoParaFacturar } from "@/lib/services/finanzas";

const COLS = "1fr 1.5fr 1fr 1fr 1fr 1fr";

function getEstatusFacturaStyle(status: string | null | undefined) {
  switch (status) {
    case "Facturado":
      return "bg-[#CCFFA5]/60 text-[#26AF00]";
    case "No_aplica":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-[#FFE4A5] text-[#8A6F02]";
  }
}

function getEstatusFacturaLabel(status: string | null | undefined) {
  switch (status) {
    case "Cotizacion":
      return "Pendiente";
    case "Facturado":
      return "Facturado";
    case "No_aplica":
      return "No aplica";
    default:
      return status ?? "—";
  }
}

interface Props {
  pedidos: PedidoParaFacturar[];
}

export function FacturacionTemplate({ pedidos }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [clienteEmpresa, setClienteEmpresa] = useState<string | null>(null);
  const [estatusFactura, setEstatusFactura] = useState<string[]>([]);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const pedidosFiltrados = pedidos.filter((p) => {
    const folio = p.cotizaciones[0]?.folio ?? "";
    const nombre = p.cliente.nombre_cliente.toLowerCase();
    const empresa = (p.cliente.empresa ?? "").toLowerCase();
    const q = search.toLowerCase();

    if (q && !folio.toLowerCase().includes(q) && !nombre.includes(q) && !empresa.includes(q)) {
      return false;
    }

    if (clienteEmpresa) {
      const ce = clienteEmpresa.toLowerCase();
      if (!nombre.includes(ce) && !empresa.includes(ce)) return false;
    }

    if (estatusFactura.length > 0) {
      const desc = p.estado_factura?.descripcion ?? "";
      if (!estatusFactura.includes(desc)) return false;
    }

    return true;
  });

  // ── Active chips ──────────────────────────────────────────────────────────
  const ESTATUS_LABEL: Record<string, string> = {
    Cotizacion: "Pendiente de facturar",
    Facturado: "Facturado",
  };

  const activeChips = [
    clienteEmpresa
      ? { key: "ce", label: `Cliente: ${clienteEmpresa}`, clear: () => setClienteEmpresa(null) }
      : null,
    ...estatusFactura.map((s) => ({
      key: `ef-${s}`,
      label: ESTATUS_LABEL[s] ?? s,
      clear: () => setEstatusFactura(estatusFactura.filter((e) => e !== s)),
    })),
  ].filter((c): c is NonNullable<typeof c> => c !== null);

  const filterCount = activeChips.length;

  return (
    <section className="max-w-337.5 mx-auto px-4 md:px-6 pt-5 space-y-4">
      {/* Search + Filter bar */}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por folio, cliente o empresa"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilter(true)}
          className="relative flex items-center justify-center gap-1.5 h-10.25 px-4 rounded-[7px] border border-[#e42200] bg-[#ffecec] font-ibm-plex font-medium text-[13px] text-[#e42200] transition-colors hover:bg-[#ffd5d5] whitespace-nowrap shrink-0"
        >
          <FilterIcon />
          Filtrar
          {filterCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-4.5 h-4.5 px-1 rounded-full bg-[#e42200] text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#ffecec] border border-[#e42200] text-[12px] font-medium text-[#e42200] hover:bg-[#ffd5d5] transition-colors"
            >
              {chip.label}
              <span aria-hidden>✕</span>
            </button>
          ))}
        </div>
      )}

      <div className="bg-transparent md:bg-white rounded">
        <div className="space-y-4 md:space-y-2">
          {/* Header — desktop only */}
          <div
            className="hidden md:grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
            style={{ gridTemplateColumns: COLS }}
          >
            <span className="whitespace-nowrap">Folio</span>
            <span className="whitespace-nowrap">Cliente</span>
            <span className="whitespace-nowrap">RFC</span>
            <span className="whitespace-nowrap">Tipo de persona</span>
            <span className="whitespace-nowrap">Estatus factura</span>
            <span className="whitespace-nowrap">Número de factura</span>
          </div>

          {pedidosFiltrados.length === 0 && (
            <div className="flex justify-center py-16 text-gray-500 text-sm">
              {pedidos.length === 0
                ? "No hay pedidos con solicitud de factura."
                : "No se encontraron resultados."}
            </div>
          )}

          {pedidosFiltrados.map((p) => {
            const cot = p.cotizaciones[0];
            const folio = cot?.folio ?? `#${p.id_pedido}`;
            const estadoFactura = p.estado_factura?.descripcion ?? null;
            const rfc = p.datos_facturacion?.rfc ?? "—";
            const tipoPersona = p.datos_facturacion?.tipo_persona;
            const tipoLabel =
              tipoPersona === "Fisica" ? "Física" : tipoPersona === "Moral" ? "Moral" : "—";
            const numeroFactura = p.numero_factura ?? "—";

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
                  <span className="whitespace-nowrap text-[13px]">{rfc}</span>
                  <span className="whitespace-nowrap">{tipoLabel}</span>
                  <div className="flex justify-center">
                    <span
                      className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getEstatusFacturaStyle(estadoFactura)}`}
                    >
                      {getEstatusFacturaLabel(estadoFactura)}
                    </span>
                  </div>
                  <span className="whitespace-nowrap text-[13px]">{numeroFactura}</span>
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
                      className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${getEstatusFacturaStyle(estadoFactura)}`}
                    >
                      {getEstatusFacturaLabel(estadoFactura)}
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
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                          RFC
                        </p>
                        <p className="text-[13px] font-medium text-[#1e1e1e]">{rfc}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                          Tipo de persona
                        </p>
                        <p className="text-[13px] font-medium text-[#1e1e1e]">{tipoLabel}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                          Número de factura
                        </p>
                        <p className="text-[13px] font-medium text-[#1e1e1e]">{numeroFactura}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FacturacionFilterSidebar
        open={showFilter}
        onClose={() => setShowFilter(false)}
        clienteEmpresa={clienteEmpresa}
        setClienteEmpresa={setClienteEmpresa}
        estatusFactura={estatusFactura}
        setEstatusFactura={setEstatusFactura}
      />
    </section>
  );
}

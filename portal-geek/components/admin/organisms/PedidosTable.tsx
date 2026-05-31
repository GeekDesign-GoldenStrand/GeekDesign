"use client";

import {
  CheckCircle,
  WarningCircle,
  StopCircle,
  CurrencyDollar,
  CaretDown,
  Info,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { DesignFileLink } from "@/components/admin/molecules/DesignFileLink";
import {
  ServiceStatusSemaphore,
  type ServiceStatusSummary,
} from "@/components/admin/molecules/ServiceStatusSemaphore";
import { Popover, PopoverItem } from "@/components/ui/primitives/Popover";
import { formatDate } from "@/lib/utils/date";

// UI → API
const STATUS_MAP_UI_TO_API: Record<string, string> = {
  Pendiente: "Pendiente",
  "En producción": "En producción",
  Finalizado: "Finalizado",
  Entregado: "Entregado",
  Cancelado: "Cancelado",
};

const INVOICE_STATUS_ORDER = [
  "Cotizacion",
  "Pagado",
  "En_cola",
  "Aprobacion_diseno",
  "En_produccion",
  "Entregado",
  "Facturado",
];

// Status color styles (pastel + readable)
function getStatusStyle(status: string) {
  switch (status) {
    case "Pendiente":
      return "bg-[#F7B9FF] text-[#700188]";

    case "En producción":
      return "bg-[#FFE4A5] text-[#8A6F02]";

    case "Finalizado":
      return "bg-[#CCFFA5] text-[#2A940D]";

    case "Entregado":
      return "bg-[#B9EAFF] text-[#0D7794]";

    case "Cancelado":
      return "bg-[#B1B1B1] text-black";

    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getAllowedPedidoStatuses(currentStatus: string): string[] {
  // Terminal states: only 'Entregado' and 'Cancelado' block further movement.
  if (currentStatus === "Entregado" || currentStatus === "Cancelado") {
    return [currentStatus];
  }

  // Any other state allows free transition between all options.
  return ["Pendiente", "En producción", "Finalizado", "Entregado", "Cancelado"];
}

// Inline status pill. Colored trigger (per-status at-a-glance recognition) +
// canonical PopoverItem panel (uniform with every other dropdown in the app).
function PedidoStatusPill({
  status,
  triggerClass,
  iconSize,
  onChange,
}: {
  status: string;
  triggerClass: string;
  iconSize: number;
  onChange: (next: string) => void;
}) {
  const allowed = getAllowedPedidoStatuses(status);

  return (
    <Popover
      align="end"
      panelClassName="min-w-[180px]"
      trigger={
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`rounded-full cursor-pointer flex items-center gap-2 ${triggerClass} ${getStatusStyle(status)}`}
        >
          <span className="whitespace-nowrap">{status}</span>
          <CaretDown size={iconSize} weight="bold" />
        </button>
      }
    >
      <div className="flex flex-col gap-1">
        {allowed.map((opt) => (
          <PopoverItem
            key={opt}
            selected={opt === status}
            onSelect={() => onChange(STATUS_MAP_UI_TO_API[opt] ?? opt)}
          >
            {opt}
          </PopoverItem>
        ))}
      </div>
    </Popover>
  );
}

function getInvoiceProgress(status?: string | null) {
  if (!status) return 0;

  const index = INVOICE_STATUS_ORDER.indexOf(status);

  if (index === -1) return 0;

  return ((index + 1) / INVOICE_STATUS_ORDER.length) * 100;
}

function getInvoiceProgressColor(status?: string | null) {
  if (!status) return "#FFFFFF";

  if (status === "Facturado") {
    return "#6ACE0D";
  }

  const index = INVOICE_STATUS_ORDER.indexOf(status);

  if (index <= 1) {
    return "#E42200";
  }

  return "#FFD631";
}

function renderInvoiceStatusIcon(status?: string | null) {
  const label = status || "Sin facturar";
  if (!status) {
    return (
      <span title={label}>
        <StopCircle size={18} className="text-gray-400" weight="fill" />
      </span>
    );
  }

  if (status === "Facturado") {
    return (
      <span title={label}>
        <CheckCircle size={18} className="text-[#6ACE0D]" weight="fill" />
      </span>
    );
  }

  return (
    <span title={label}>
      <WarningCircle size={18} className="text-[#E42200]" weight="fill" />
    </span>
  );
}

interface PedidoDetalle {
  id_detalle: number;
  id_servicio: number;
  id_material?: number;
  id_archivo?: number;
  cantidad?: number;
  responsable_recoleccion?: string;
  notas?: string | null;
  precio_unitario?: unknown;
  subtotal?: unknown;
  estatus?: {
    descripcion: string;
  } | null;
  servicio?: {
    nombre_servicio: string;
  };
  variablesCotizacion?: Array<{
    id_variable: number;
    valor: unknown;
    variable: {
      nombre_variable: string;
    };
  }>;
}

function groupDetailsBySpecs(details: PedidoDetalle[]): PedidoDetalle[][] {
  const groups: PedidoDetalle[][] = [];

  for (const detail of details) {
    let foundGroup = false;

    for (const group of groups) {
      const first = group[0];

      // Compare specifications
      const match =
        detail.id_servicio === first.id_servicio &&
        detail.id_material === first.id_material &&
        detail.id_archivo === first.id_archivo &&
        detail.cantidad === first.cantidad &&
        detail.responsable_recoleccion === first.responsable_recoleccion &&
        detail.notas === first.notas &&
        Number((detail.precio_unitario as string | number) ?? 0) ===
          Number((first.precio_unitario as string | number) ?? 0);

      if (match) {
        // Compare variablesCotizacion
        const vars1 = detail.variablesCotizacion || [];
        const vars2 = first.variablesCotizacion || [];

        if (vars1.length === vars2.length) {
          const map1 = new Map(
            vars1.map((v) => [
              v.variable.nombre_variable,
              Number((v.valor as string | number) ?? 0),
            ])
          );
          let varsMatch = true;

          for (const v2 of vars2) {
            const val1 = map1.get(v2.variable.nombre_variable);
            if (val1 === undefined || val1 !== Number((v2.valor as string | number) ?? 0)) {
              varsMatch = false;
              break;
            }
          }

          if (varsMatch) {
            group.push(detail);
            foundGroup = true;
            break;
          }
        }
      }
    }

    if (!foundGroup) {
      groups.push([detail]);
    }
  }

  return groups;
}

interface Pedido {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  folio?: string | null;
  monto_total?: number | null;
  nombre_oportunidad?: string | null;

  cliente: {
    nombre_cliente: string;
    empresa?: string | null;
  };

  estatus: {
    descripcion: string;
  };

  estado_factura?: {
    descripcion: string;
  } | null;

  detalles?: PedidoDetalle[];
  serviceStatusSummary?: ServiceStatusSummary;
  archivos: { id: number; nombre: string }[];
}

interface Props {
  pedidos: Pedido[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  selectedServiceId: number | null;
  onDetalleStatusChange: (detalleIds: number[], status: string) => void;
}

export function PedidosTable({ pedidos, selectedServiceId, onDetalleStatusChange }: Props) {
  const router = useRouter();
  if (pedidos.length === 0) {
    return (
      <div className="flex justify-center py-16 text-[#8e908f]">No se encontraron pedidos.</div>
    );
  }

  const flattenedRows: Array<{
    key: string;
    pedido: Pedido;
    group: PedidoDetalle[];
    serviceName: string;
  }> = [];

  if (selectedServiceId) {
    for (const p of pedidos) {
      const matchingDetails = p.detalles ?? [];
      const filteredDetails = matchingDetails.filter((d) => d.id_servicio === selectedServiceId);

      if (filteredDetails.length > 0) {
        const groups = groupDetailsBySpecs(filteredDetails);
        groups.forEach((group, idx) => {
          const firstDetail = group[0];
          const serviceName = firstDetail.servicio?.nombre_servicio ?? "—";
          flattenedRows.push({
            key: `pedido-${p.id_pedido}-group-${idx}`,
            pedido: p,
            group,
            serviceName,
          });
        });
      }
    }
  }

  if (selectedServiceId && flattenedRows.length === 0) {
    return (
      <div className="flex justify-center py-16 text-[#8e908f]">No se encontraron productos.</div>
    );
  }

  return (
    <div className="bg-transparent md:bg-white rounded">
      <div className="space-y-4 md:space-y-2">
        {/* Header - Desktop Only */}
        <div
          className="hidden md:grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1.2fr",
          }}
        >
          <span className="whitespace-nowrap">Fecha de creación</span>
          <span className="whitespace-nowrap">Fecha de entrega</span>
          <span className="whitespace-nowrap">Empresa</span>
          <span className="whitespace-nowrap">Nombre de oportunidad</span>
          <span className="whitespace-nowrap">{selectedServiceId ? "Subtotal" : "Monto"}</span>
          <span className="whitespace-nowrap">Folio</span>
          <span className="whitespace-nowrap">
            {selectedServiceId ? "Estatus del servicio" : "Semáforo de servicios"}{" "}
            <Info
              size={24}
              weight="fill"
              className="inline-block ml-2 cursor-pointer text-black bg-transparent border-2 border-black rounded-full p-0.5"
              onClick={() =>
                document.getElementById("pedidos-index")?.scrollIntoView({ behavior: "smooth" })
              }
            />
          </span>
          <span className="whitespace-nowrap">Estado factura</span>
        </div>

        {/* Rows */}
        {selectedServiceId
          ? flattenedRows.map((row) => {
              const p = row.pedido;
              const firstDetail = row.group[0];
              const status = firstDetail
                ? (firstDetail.estatus?.descripcion ?? "Pendiente")
                : "Pendiente";
              const ids = row.group.map((d) => d.id_detalle);
              const rowTotal = row.group.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0);

              return (
                <div key={row.key}>
                  {/* Desktop Row — entire row opens the pedido detail */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      router.push(`/pedidos/${p.id_pedido}?detalleIds=${ids.join(",")}`)
                    }
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/pedidos/${p.id_pedido}?detalleIds=${ids.join(",")}`);
                      }
                    }}
                    aria-label={`Ver detalle del pedido ${p.folio ?? p.id_pedido}`}
                    className="hidden md:grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
                    style={{
                      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1.2fr",
                    }}
                  >
                    <span className="whitespace-nowrap">{formatDate(p.fecha_creacion)}</span>
                    <span className="whitespace-nowrap">
                      {p.fecha_estimada ? formatDate(p.fecha_estimada) : "—"}
                    </span>
                    <span className="truncate px-2 min-w-0">{p.cliente?.empresa ?? "—"}</span>
                    <span className="truncate px-2 min-w-0">{p.nombre_oportunidad ?? "—"}</span>
                    <span className="whitespace-nowrap">
                      {rowTotal > 0 ? `$${rowTotal.toLocaleString("es-MX")} MXN` : "—"}
                    </span>
                    <span className="whitespace-nowrap font-medium">{p.folio ?? "—"}</span>
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <PedidoStatusPill
                        status={status}
                        triggerClass="pl-4 pr-3 py-1 text-sm font-medium"
                        iconSize={14}
                        onChange={(apiValue) => onDetalleStatusChange(ids, apiValue)}
                      />
                    </div>
                    <div className="flex flex-col items-center px-2 min-w-[180px]">
                      <div className="flex items-center gap-2 w-full">
                        <CurrencyDollar size={16} className="text-[#1e1e1e] flex-shrink-0" />
                        <div className="w-full h-2 bg-[#ececec] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${getInvoiceProgress(p.estado_factura?.descripcion)}%`,
                              backgroundColor: getInvoiceProgressColor(
                                p.estado_factura?.descripcion
                              ),
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[12px] whitespace-nowrap">
                        <span className="text-[#6f6f6f]">Factura:</span>
                        {renderInvoiceStatusIcon(p.estado_factura?.descripcion)}
                        <div onClick={(e) => e.stopPropagation()}>
                          <DesignFileLink
                            archivos={p.archivos}
                            className="ml-1 h-7 w-7 flex items-center justify-center bg-[#fff0f3] rounded-full text-[#8b434a] relative"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Card */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      router.push(`/pedidos/${p.id_pedido}?detalleIds=${ids.join(",")}`)
                    }
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/pedidos/${p.id_pedido}?detalleIds=${ids.join(",")}`);
                      }
                    }}
                    aria-label={`Ver detalle del pedido ${p.folio ?? p.id_pedido}`}
                    className="md:hidden bg-white p-5 rounded-xl shadow-sm border border-[#F0F0F0] space-y-4 cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                          Pedido
                        </p>
                        <p className="text-[16px] font-bold text-[#1e1e1e]">#{p.id_pedido}</p>
                      </div>
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <PedidoStatusPill
                          status={status}
                          triggerClass="pl-3 pr-2 py-1 text-[11px] font-bold"
                          iconSize={12}
                          onChange={(apiValue) => onDetalleStatusChange(ids, apiValue)}
                        />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#F5F5F5] space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                            Cliente
                          </p>
                          <p className="text-[13px] font-medium text-[#1e1e1e]">
                            {p.cliente?.nombre_cliente}
                          </p>
                          <p className="text-[11px] text-[#8e908f]">
                            {p.cliente?.empresa || "Sin empresa"}
                          </p>
                          <p className="mt-2 text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                            Oportunidad
                          </p>
                          <p className="text-[12px] font-medium text-[#1e1e1e]">
                            {p.nombre_oportunidad ?? "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                            Folio
                          </p>
                          <p className="text-[12px] font-semibold text-[#575757] mb-2">
                            {p.folio ?? "—"}
                          </p>
                          <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                            Subtotal
                          </p>
                          <p className="text-[13px] font-bold text-[#1e1e1e]">
                            {rowTotal > 0 ? `$${rowTotal.toLocaleString("es-MX")}` : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#fcfcfc] rounded-lg p-3 space-y-2 border border-[#f0f0f0]">
                        <div className="flex justify-between items-center text-[11px] font-bold text-[#8e908f] uppercase">
                          <span>Estado de Factura</span>
                          <span>
                            {getInvoiceProgress(p.estado_factura?.descripcion).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#ececec] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${getInvoiceProgress(p.estado_factura?.descripcion)}%`,
                              backgroundColor: getInvoiceProgressColor(
                                p.estado_factura?.descripcion
                              ),
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-[#6f6f6f]">Estatus:</span>
                          <span className="font-bold text-[#1e1e1e]">
                            {p.estado_factura?.descripcion || "Sin facturar"}
                          </span>
                          {renderInvoiceStatusIcon(p.estado_factura?.descripcion)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-[#8e908f] uppercase mb-0.5">
                            Fecha
                          </p>
                          <p className="text-[11px] font-medium text-[#575757]">
                            {formatDate(p.fecha_creacion)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#8e908f] uppercase mb-0.5">
                            Entrega
                          </p>
                          <p className="text-[11px] font-medium text-[#575757]">
                            {p.fecha_estimada ? formatDate(p.fecha_estimada) : "—"}
                          </p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DesignFileLink
                          archivos={p.archivos}
                          className="h-8 w-8 flex items-center justify-center bg-[#fff0f3] rounded-full text-[#8b434a] relative"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          : pedidos.map((p) => (
              <div key={p.id_pedido}>
                {/* Desktop Row — entire row opens the pedido detail */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/pedidos/${p.id_pedido}`)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/pedidos/${p.id_pedido}`);
                    }
                  }}
                  aria-label={`Ver detalle del pedido ${p.folio ?? p.id_pedido}`}
                  className="hidden md:grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
                  style={{
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1.2fr",
                  }}
                >
                  <span className="whitespace-nowrap">{formatDate(p.fecha_creacion)}</span>
                  <span className="whitespace-nowrap">
                    {p.fecha_estimada ? formatDate(p.fecha_estimada) : "—"}
                  </span>
                  <span className="truncate px-2 min-w-0">{p.cliente?.empresa ?? "—"}</span>
                  <span className="truncate px-2 min-w-0">{p.nombre_oportunidad ?? "—"}</span>
                  <span className="whitespace-nowrap">
                    {p.monto_total != null ? `$${p.monto_total.toLocaleString("es-MX")} MXN` : "—"}
                  </span>
                  <span className="whitespace-nowrap font-medium">{p.folio ?? "—"}</span>
                  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <ServiceStatusSemaphore summary={p.serviceStatusSummary} />
                  </div>
                  <div className="flex flex-col items-center px-2 min-w-[180px]">
                    <div className="flex items-center gap-2 w-full">
                      <CurrencyDollar size={16} className="text-[#1e1e1e] flex-shrink-0" />
                      <div className="w-full h-2 bg-[#ececec] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${getInvoiceProgress(p.estado_factura?.descripcion)}%`,
                            backgroundColor: getInvoiceProgressColor(p.estado_factura?.descripcion),
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[12px] whitespace-nowrap">
                      <span className="text-[#6f6f6f]">Factura:</span>
                      {renderInvoiceStatusIcon(p.estado_factura?.descripcion)}
                      <div onClick={(e) => e.stopPropagation()}>
                        <DesignFileLink
                          archivos={p.archivos}
                          className="ml-1 h-7 w-7 flex items-center justify-center bg-[#fff0f3] rounded-full text-[#8b434a] relative"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/pedidos/${p.id_pedido}`)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/pedidos/${p.id_pedido}`);
                    }
                  }}
                  aria-label={`Ver detalle del pedido ${p.folio ?? p.id_pedido}`}
                  className="md:hidden bg-white p-5 rounded-xl shadow-sm border border-[#F0F0F0] space-y-4 cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                        Pedido
                      </p>
                      <p className="text-[16px] font-bold text-[#1e1e1e]">#{p.id_pedido}</p>
                    </div>
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <ServiceStatusSemaphore summary={p.serviceStatusSummary} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#F5F5F5] space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                          Cliente
                        </p>
                        <p className="text-[13px] font-medium text-[#1e1e1e]">
                          {p.cliente?.nombre_cliente}
                        </p>
                        <p className="text-[11px] text-[#8e908f]">
                          {p.cliente?.empresa || "Sin empresa"}
                        </p>
                        <p className="mt-2 text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                          Oportunidad
                        </p>
                        <p className="text-[12px] font-medium text-[#1e1e1e]">
                          {p.nombre_oportunidad ?? "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                          Folio
                        </p>
                        <p className="text-[12px] font-semibold text-[#575757] mb-2">
                          {p.folio ?? "—"}
                        </p>
                        <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                          Monto
                        </p>
                        <p className="text-[13px] font-bold text-[#1e1e1e]">
                          {p.monto_total != null
                            ? `$${p.monto_total.toLocaleString("es-MX")}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#fcfcfc] rounded-lg p-3 space-y-2 border border-[#f0f0f0]">
                      <div className="flex justify-between items-center text-[11px] font-bold text-[#8e908f] uppercase">
                        <span>Estado de Factura</span>
                        <span>{getInvoiceProgress(p.estado_factura?.descripcion).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#ececec] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${getInvoiceProgress(p.estado_factura?.descripcion)}%`,
                            backgroundColor: getInvoiceProgressColor(p.estado_factura?.descripcion),
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-[#6f6f6f]">Estatus:</span>
                        <span className="font-bold text-[#1e1e1e]">
                          {p.estado_factura?.descripcion || "Sin facturar"}
                        </span>
                        {renderInvoiceStatusIcon(p.estado_factura?.descripcion)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#8e908f] uppercase mb-0.5">
                          Fecha
                        </p>
                        <p className="text-[11px] font-medium text-[#575757]">
                          {formatDate(p.fecha_creacion)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#8e908f] uppercase mb-0.5">
                          Entrega
                        </p>
                        <p className="text-[11px] font-medium text-[#575757]">
                          {p.fecha_estimada ? formatDate(p.fecha_estimada) : "—"}
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DesignFileLink
                        archivos={p.archivos}
                        className="h-8 w-8 flex items-center justify-center bg-[#fff0f3] rounded-full text-[#8b434a] relative"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

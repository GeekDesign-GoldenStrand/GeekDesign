"use client";

import {
  PencilSimple,
  CheckCircle,
  WarningCircle,
  StopCircle,
  CurrencyDollar,
  CaretDown,
} from "@phosphor-icons/react";

import { DesignFileLink } from "@/components/admin/molecules/DesignFileLink";
import {
  ServiceStatusSemaphore,
  type ServiceStatusSummary,
} from "@/components/admin/molecules/ServiceStatusSemaphore";
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
  if (!status) {
    return <StopCircle size={18} className="text-gray-400" weight="fill" />;
  }

  if (status === "Facturado") {
    return <CheckCircle size={18} className="text-[#6ACE0D]" weight="fill" />;
  }

  return <WarningCircle size={18} className="text-[#E42200]" weight="fill" />;
}

interface PedidoDetalle {
  id_detalle: number;
  id_servicio: number;
  estatus?: {
    descripcion: string;
  } | null;
  servicio?: {
    nombre_servicio: string;
  };
}

interface Pedido {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  folio?: string | null;
  monto_total?: number | null;

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
  onDetalleStatusChange: (detalleId: number, status: string) => void;
  onShowDetail: (id: number) => void;
}

export function PedidosTable({
  pedidos,
  selectedServiceId,
  onDetalleStatusChange,
  onShowDetail,
}: Props) {
  if (pedidos.length === 0) {
    return (
      <div className="flex justify-center py-16 text-[#8e908f]">No se encontraron pedidos.</div>
    );
  }

  return (
    <div className="bg-transparent md:bg-white rounded">
      <div className="space-y-4 md:space-y-2">
        {/* Header - Desktop Only */}
        <div
          className="hidden md:grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1.2fr 0.5fr",
          }}
        >
          <span className="whitespace-nowrap">Fecha de creación</span>
          <span className="whitespace-nowrap">Fecha de entrega</span>
          <span className="whitespace-nowrap">Empresa</span>
          <span className="whitespace-nowrap">Nombre de oportunidad</span>
          <span className="whitespace-nowrap">Monto</span>
          <span className="whitespace-nowrap">Folio</span>
          <span className="whitespace-nowrap">
            {selectedServiceId ? "Estatus del servicio" : "Semáforo de servicios"}
          </span>
          <span className="whitespace-nowrap">Estado factura</span>
          <span className="whitespace-nowrap">Acciones</span>
        </div>

        {/* Rows */}
        {pedidos.map((p) => {
          const selectedServiceDetail = selectedServiceId
            ? p.detalles?.find((detalle) => detalle.id_servicio === selectedServiceId)
            : null;

          const selectedServiceStatus = selectedServiceDetail?.estatus?.descripcion ?? "Pendiente";

          return (
            <div key={p.id_pedido}>
              {/* Desktop Row — entire row opens the pedido detail */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onShowDetail(p.id_pedido)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onShowDetail(p.id_pedido);
                  }
                }}
                aria-label={`Ver detalle del pedido ${p.folio ?? p.id_pedido}`}
                className="hidden md:grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
                style={{
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1.2fr 0.5fr",
                }}
              >
                {/* Fecha de creación */}
                <span className="whitespace-nowrap">{formatDate(p.fecha_creacion)}</span>

                {/* Fecha de entrega */}
                <span className="whitespace-nowrap">
                  {p.fecha_estimada ? formatDate(p.fecha_estimada) : "—"}
                </span>

                {/* Empresa */}
                <span className="truncate px-2 min-w-0">{p.cliente?.empresa ?? "—"}</span>

                {/* Nombre de oportunidad */}
                <span className="truncate px-2 min-w-0">{p.cliente?.nombre_cliente}</span>

                {/* Monto */}
                <span className="whitespace-nowrap">
                  {p.monto_total != null ? `$${p.monto_total.toLocaleString("es-MX")} MXN` : "—"}
                </span>

                {/* Folio */}
                <span className="whitespace-nowrap font-medium">{p.folio ?? "—"}</span>

                {/* Semáforo general o estatus del servicio seleccionado */}
                <div className="flex justify-center">
                  {selectedServiceId && selectedServiceDetail ? (
                    <div
                      className={`relative flex items-center rounded-full ${getStatusStyle(
                        selectedServiceStatus
                      )}`}
                    >
                      <select
                        value={selectedServiceStatus}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const uiValue = e.target.value;
                          const apiValue = STATUS_MAP_UI_TO_API[uiValue] ?? uiValue;

                          onDetalleStatusChange(selectedServiceDetail.id_detalle, apiValue);
                        }}
                        className="pl-4 pr-8 py-1 rounded-full text-sm font-medium outline-none cursor-pointer appearance-none bg-transparent whitespace-nowrap"
                      >
                        {getAllowedPedidoStatuses(selectedServiceStatus).map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>

                      <CaretDown
                        size={14}
                        weight="bold"
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                      />
                    </div>
                  ) : (
                    <ServiceStatusSemaphore summary={p.serviceStatusSummary} />
                  )}
                </div>

                {/* Estado factura */}
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
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex justify-center items-center gap-1">
                  {/* Fixed slot so the optional design-file clip doesn't shift the edit icon */}
                  <span
                    className="flex w-[34px] shrink-0 justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DesignFileLink
                      archivos={p.archivos}
                      className="text-[#8b434a] hover:text-[#7a3a41] transition-colors p-2 relative"
                    />
                  </span>

                  <a
                    href={`/pedidos/${p.id_pedido}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-black hover:text-[#e42200] p-2"
                    title="Editar pedido"
                    aria-label={`Editar pedido ${p.folio ?? p.id_pedido}`}
                  >
                    <PencilSimple size={18} />
                  </a>
                </div>
              </div>

              {/* Mobile Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onShowDetail(p.id_pedido)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onShowDetail(p.id_pedido);
                  }
                }}
                aria-label={`Ver detalle del pedido ${p.folio ?? p.id_pedido}`}
                className="md:hidden bg-white p-5 rounded-xl shadow-sm border border-[#F0F0F0] space-y-4 cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
              >
                {/* Header: pedido id + service status control/semaphore */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                      Pedido
                    </p>

                    <p className="text-[16px] font-bold text-[#1e1e1e]">#{p.id_pedido}</p>
                  </div>

                  {/* Service status:
                    - General view: show semaphore.
                    - Service-filtered view: show editable status for that service detail. */}
                  <div className="flex justify-end">
                    {selectedServiceId && selectedServiceDetail ? (
                      <div
                        className={`relative flex items-center rounded-full ${getStatusStyle(
                          selectedServiceStatus
                        )}`}
                      >
                        <select
                          value={selectedServiceStatus}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const uiValue = e.target.value;
                            const apiValue = STATUS_MAP_UI_TO_API[uiValue] ?? uiValue;

                            onDetalleStatusChange(selectedServiceDetail.id_detalle, apiValue);
                          }}
                          className="pl-3 pr-8 py-1 rounded-full text-[11px] font-bold outline-none appearance-none bg-transparent"
                        >
                          {getAllowedPedidoStatuses(selectedServiceStatus).map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>

                        <CaretDown
                          size={12}
                          weight="bold"
                          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                        />
                      </div>
                    ) : (
                      <ServiceStatusSemaphore summary={p.serviceStatusSummary} />
                    )}
                  </div>
                </div>

                {/* Client and amount summary */}
                <div className="pt-2 border-t border-[#F5F5F5] space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    {/* Client info */}
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
                    </div>

                    {/* Folio and amount */}
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
                        {p.monto_total != null ? `$${p.monto_total.toLocaleString("es-MX")}` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Invoice status progress */}
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

                {/* Dates and actions */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-4">
                    {/* Creation date */}
                    <div>
                      <p className="text-[10px] font-bold text-[#8e908f] uppercase mb-0.5">Fecha</p>

                      <p className="text-[11px] font-medium text-[#575757]">
                        {formatDate(p.fecha_creacion)}
                      </p>
                    </div>

                    {/* Estimated delivery date */}
                    <div>
                      <p className="text-[10px] font-bold text-[#8e908f] uppercase mb-0.5">
                        Entrega
                      </p>

                      <p className="text-[11px] font-medium text-[#575757]">
                        {p.fecha_estimada ? formatDate(p.fecha_estimada) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <DesignFileLink
                      archivos={p.archivos}
                      className="h-10 w-10 flex items-center justify-center bg-[#fff0f3] rounded-full text-[#8b434a] relative"
                    />

                    <a
                      href={`/pedidos/${p.id_pedido}`}
                      className="h-10 w-10 flex items-center justify-center bg-[#F5F5F5] rounded-full text-[#1e1e1e] hover:text-[#e42200] transition-colors"
                      title="Editar pedido"
                      aria-label={`Editar pedido ${p.folio ?? p.id_pedido}`}
                    >
                      <PencilSimple size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

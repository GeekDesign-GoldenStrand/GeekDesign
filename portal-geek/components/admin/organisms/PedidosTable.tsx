<<<<<<< HEAD
// Frontend type for an order (pedido)
interface Pedido {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
=======
"use client";

import {
  PencilSimple,
  CheckCircle,
  WarningCircle,
  StopCircle,
  CurrencyDollar,
  CaretDown,
} from "@phosphor-icons/react";

import { formatDate } from "@/lib/utils/date";

// UI → API
const STATUS_MAP_UI_TO_API: Record<string, string> = {
  Pendiente: "Pendiente",
  "En producción": "En_produccion",
  Finalizado: "Finalizado",
  Entregado: "Entregado",
  Cancelado: "Cancelado",
};

// API → UI
const STATUS_MAP_API_TO_UI: Record<string, string> = {
  Pendiente: "Pendiente",
  En_produccion: "En producción",
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

interface Pedido {
  id_pedido: number;
  fecha_creacion: string;

  fecha_estimada?: string | null;

  monto_total?: number | null;

>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d
  cliente: {
    nombre_cliente: string;
    empresa?: string | null;
  };
<<<<<<< HEAD
  estatus: {
    descripcion: string;
  };
  factura: boolean;
}

// Props define the data and callbacks passed into the table
interface Props {
  pedidos: Pedido[]; // list of orders to display
  onDelete: (id: number) => void; // callback to delete an order
  onStatusChange: (id: number, status: string) => void; // callback to update order status
}

export function PedidosTable({ pedidos, onDelete, onStatusChange }: Props) {
  // Empty state: show message if there are no orders
=======

  estatus: {
    descripcion: string;
  };

  estado_factura?: {
    descripcion: string;
  } | null;
}

interface Props {
  pedidos: Pedido[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}

export function PedidosTable({ pedidos, onStatusChange }: Props) {
>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d
  if (pedidos.length === 0) {
    return (
      <div className="flex justify-center py-16 text-[#8e908f]">No se encontraron pedidos.</div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="space-y-2">
      {/* Table header row */}
      <div
        className="grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
        style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr" }}
      >
        <span>Fecha</span>
        <span>Entrega</span>
        <span>Empresa</span>
        <span>Cliente</span>
        <span>Estatus</span>
        <span>Factura</span>
        <span>Acciones</span>
      </div>

      {/* Table rows: render one per order */}
      {pedidos.map((p) => (
        <div
          key={p.id_pedido}
          className="grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr" }}
        >
          {/* Basic fields */}
          <span>{new Date(p.fecha_creacion).toLocaleDateString()}</span>
          <span>{p.fecha_estimada ?? "—"}</span>
          <span>{p.cliente?.empresa ?? "—"}</span>
          <span>{p.cliente?.nombre_cliente}</span>

          {/* Status dropdown: allows updating order status */}
          <select
            value={p.estatus?.descripcion}
            onChange={(e) => onStatusChange(p.id_pedido, e.target.value)}
            className="border rounded px-2 py-1 bg-white"
          >
            <option value="Cotizacion">Cotización</option>
            <option value="Pagado">Pagado</option>
            <option value="En_cola">En cola</option>
            <option value="Aprobacion_diseno">Aprobación diseño</option>
            <option value="En_produccion">En producción</option>
            <option value="Entregado">Entregado</option>
            <option value="Facturado">Facturado</option>
          </select>

          {/* Invoice status */}
          <span>{p.factura ? "Sí" : "No"}</span>

          {/* Action buttons: edit and delete */}
          <div className="flex justify-center gap-2">
            <a href={`/admin/pedidos/${p.id_pedido}`} className="text-blue-600 hover:underline">
              Editar
            </a>
            <button onClick={() => onDelete(p.id_pedido)} className="text-red-600 hover:underline">
              Eliminar
            </button>
          </div>
        </div>
      ))}
=======
    <div className="overflow-x-auto bg-white rounded">
      <div className="space-y-2 min-w-max">
        {/* Header */}
        <div
          className="grid px-2 md:px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-xs md:text-sm text-center"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1.2fr 0.5fr",
          }}
        >
          <span className="whitespace-nowrap">Fecha</span>
          <span className="whitespace-nowrap">Monto</span>
          <span className="whitespace-nowrap">Entrega</span>
          <span className="whitespace-nowrap">Empresa</span>
          <span className="whitespace-nowrap">Cliente</span>
          <span className="whitespace-nowrap">Estatus</span>
          <span className="whitespace-nowrap">Estado factura</span>
          <span className="whitespace-nowrap">Acciones</span>
        </div>

        {pedidos.map((p) => (
          <div
            key={p.id_pedido}
            className="grid px-2 md:px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-xs md:text-sm items-center text-center"
            style={{
              gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1.2fr 0.5fr",
            }}
          >
            {/* Fecha */}
            <span className="whitespace-nowrap">{formatDate(p.fecha_creacion)}</span>

            {/* Monto */}
            <span className="whitespace-nowrap">
              {p.monto_total != null ? `$${p.monto_total.toLocaleString("es-MX")} MXN` : "—"}
            </span>

            {/* Entrega */}
            <span className="whitespace-nowrap">
              {p.fecha_estimada ? formatDate(p.fecha_estimada) : "—"}
            </span>

            {/* Empresa */}
            <span className="whitespace-nowrap">{p.cliente?.empresa ?? "—"}</span>

            {/* Cliente */}
            <span className="whitespace-nowrap">{p.cliente?.nombre_cliente}</span>

            {/* STATUS SELECT */}
            <div className="flex justify-center">
              <div
                className={`relative flex items-center rounded-full ${getStatusStyle(
                  p.estatus?.descripcion
                )}`}
              >
                <select
                  value={STATUS_MAP_API_TO_UI[p.estatus?.descripcion] ?? p.estatus?.descripcion}
                  onChange={(e) => {
                    const uiValue = e.target.value;
                    const apiValue = STATUS_MAP_UI_TO_API[uiValue] ?? uiValue;

                    onStatusChange(p.id_pedido, apiValue);
                  }}
                  className="pl-3 md:pl-4 pr-7 md:pr-7 py-1 rounded-full text-xs md:text-sm font-medium outline-none cursor-pointer appearance-none bg-transparent whitespace-nowrap"
                >
                  <option>Pendiente</option>
                  <option>En producción</option>
                  <option>Finalizado</option>
                  <option>Entregado</option>
                  <option>Cancelado</option>
                </select>

                <CaretDown
                  size={14}
                  weight="bold"
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            {/* Estado Factura */}
            <div className="flex flex-col items-center px-1 md:px-2 min-w-[180px]">
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

              <div className="flex items-center gap-1 mt-1 text-[11px] md:text-[12px] whitespace-nowrap">
                <span className="text-[#6f6f6f]">Factura:</span>

                {renderInvoiceStatusIcon(p.estado_factura?.descripcion)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center">
              <a
                href={`/admin/pedidos/${p.id_pedido}`}
                className="text-black hover:text-[#e42200] p-2"
              >
                <PencilSimple size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>
>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d
    </div>
  );
}

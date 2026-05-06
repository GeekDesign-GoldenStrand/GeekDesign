"use client";

import { PencilSimple } from "phosphor-react";

// UI → API
const STATUS_MAP_UI_TO_API: Record<string, string> = {
  "Cotización": "Cotizacion",
  "Pagado": "Pagado",
  "En cola": "En_cola",
  "Aprobación diseño": "Aprobacion_diseno",
  "En producción": "En_produccion",
  "Entregado": "Entregado",
  "Facturado": "Facturado",
};

// API → UI
const STATUS_MAP_API_TO_UI: Record<string, string> = {
  "Cotizacion": "Cotización",
  "Pagado": "Pagado",
  "En_cola": "En cola",
  "Aprobacion_diseno": "Aprobación diseño",
  "En_produccion": "En producción",
  "Entregado": "Entregado",
  "Facturado": "Facturado",
};

// Status color styles (pastel + readable)
function getStatusStyle(status: string) {
  switch (status) {
    case "Cotizacion":
      return "bg-red-100 text-red-700";
    case "Pagado":
      return "bg-orange-100 text-orange-700";
    case "En_cola":
      return "bg-yellow-100 text-yellow-800";
    case "Aprobacion_diseno":
      return "bg-blue-100 text-blue-700";
    case "En_produccion":
      return "bg-purple-100 text-purple-700";
    case "Entregado":
      return "bg-green-100 text-green-700";
    case "Facturado":
      return "bg-green-200 text-green-900";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

interface Pedido {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  cliente: {
    nombre_cliente: string;
    empresa?: string | null;
  };
  estatus: {
    descripcion: string;
  };
  factura: boolean;
}

interface Props {
  pedidos: Pedido[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}

export function PedidosTable({ pedidos, onStatusChange }: Props) {
  if (pedidos.length === 0) {
    return (
      <div className="flex justify-center py-16 text-[#8e908f]">
        No se encontraron pedidos.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div
        className="grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
        style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 0.5fr" }}
      >
        <span>Fecha</span>
        <span>Entrega</span>
        <span>Empresa</span>
        <span>Cliente</span>
        <span>Estatus</span>
        <span>Factura</span>
        <span>Acciones</span>
      </div>

      {pedidos.map((p) => (
        <div
          key={p.id_pedido}
          className="grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 0.5fr" }}
        >
          <span>
            {new Date(p.fecha_creacion).toLocaleDateString("es-MX")}
          </span>

          <span>
            {p.fecha_estimada
              ? new Date(p.fecha_estimada).toLocaleDateString("es-MX")
              : "—"}
          </span>

          <span>{p.cliente?.empresa ?? "—"}</span>
          <span>{p.cliente?.nombre_cliente}</span>

          {/* STATUS SELECT */}
          <div className="flex justify-center">
            <select
              value={
                STATUS_MAP_API_TO_UI[p.estatus?.descripcion] ??
                p.estatus?.descripcion
              }
              onChange={(e) => {
                const uiValue = e.target.value;
                const apiValue = STATUS_MAP_UI_TO_API[uiValue] ?? uiValue;
                onStatusChange(p.id_pedido, apiValue);
              }}
              className={`px-4 py-1 rounded-full text-sm font-medium outline-none cursor-pointer ${getStatusStyle(
                p.estatus?.descripcion
              )}`}
            >
              <option>Cotización</option>
              <option>Pagado</option>
              <option>En cola</option>
              <option>Aprobación diseño</option>
              <option>En producción</option>
              <option>Entregado</option>
              <option>Facturado</option>
            </select>
          </div>

          <span>{p.factura ? "Sí" : "No"}</span>

          {/* Actions */}
          <div className="flex justify-center">
            <a
              href={`/admin/pedidos/${p.id_pedido}`}
              className="text-black hover:text-[#e42200] p-2"
            >
              <PencilSimple size={20} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
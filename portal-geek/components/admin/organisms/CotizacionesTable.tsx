"use client";

import { PencilSimple } from "@phosphor-icons/react";

const STATUS_MAP_UI_TO_API: Record<string, string> = {
  "En revisión": "En_revision",
  Aprobada: "Aprobada",
  Rechazada: "Rechazada",
  Validada: "Validada",
};

const STATUS_MAP_API_TO_UI: Record<string, string> = {
  En_revision: "En revisión",
  Aprobada: "Aprobada",
  Rechazada: "Rechazada",
  Validada: "Validada",
};

type Cotizacion = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  empresa: string | null;
  cliente: string;
  estatus: string;
  fecha_estimada: string | null;
};

type Props = {
  cotizaciones: Cotizacion[];
  onDelete: (id: number) => void; // no se usa pero lo dejamos para no romper props
  onStatusChange: (id: number, status: string) => void;
};

// 🎨 Helper para estilos de estatus tipo Figma
function getStatusStyle(status: string) {
  switch (status) {
    case "Aprobada":
      return "bg-green-100 text-green-800";
    case "Rechazada":
      return "bg-gray-200 text-black";
    case "En revisión":
    case "En_revision":
      return "bg-purple-100 text-purple-800";
    case "Validada":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function CotizacionesTable({ cotizaciones, onStatusChange }: Props) {
  if (cotizaciones.length === 0) {
    return (
      <div className="flex justify-center py-16 text-gray-500">No se encontraron cotizaciones.</div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div
        className="grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
        style={{
          gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr 1.2fr 1fr 0.6fr",
        }}
      >
        <span>Fecha</span>
        <span>Monto</span>
        <span>Entrega</span>
        <span>Empresa</span>
        <span>Cliente</span>
        <span>Estatus</span>
        <span>Acciones</span>
      </div>

      {cotizaciones.map((c) => (
        <div
          key={c.id_cotizacion}
          className="grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 0.5fr",
          }}
        >
          {/* Fecha */}
          <span>
            {c.fecha_creacion ? new Date(c.fecha_creacion).toLocaleDateString("es-MX") : "—"}
          </span>

          {/* Monto */}
          <span>${c.monto_total.toLocaleString("es-MX")} MXN</span>

          {/* Entrega */}
          <span>
            {c.fecha_estimada ? new Date(c.fecha_estimada).toLocaleDateString("es-MX") : "—"}
          </span>

          {/* Empresa */}
          <span>{c.empresa || "—"}</span>

          {/* Cliente */}
          <span>{c.cliente}</span>

          {/* Estatus */}
          <div className="flex justify-center">
            <select
              value={STATUS_MAP_API_TO_UI[c.estatus] ?? c.estatus}
              onChange={(e) => {
                const uiValue = e.target.value;
                const apiValue = STATUS_MAP_UI_TO_API[uiValue] ?? uiValue;
                onStatusChange(c.id_cotizacion, apiValue);
              }}
              className={`px-4 py-1 rounded-full text-sm font-medium outline-none cursor-pointer ${getStatusStyle(
                c.estatus
              )}`}
            >
              <option value="En revisión">En revisión</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
              <option value="Validada">Validada</option>
            </select>
          </div>

          {/* Acciones */}
          <div className="flex justify-center">
            <button
              className="text-black hover:text-[#e42200] transition-colors p-2"
              title="Editar cotización"
            >
              <PencilSimple size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

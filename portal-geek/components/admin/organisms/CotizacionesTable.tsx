"use client";

import { PencilSimple, CaretDown } from "@phosphor-icons/react";

import { formatDate } from "@/lib/utils/date";

type Cotizacion = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  empresa: string | null;
  cliente: string;
  folio: string | null;
  estatus: string;
  fecha_estimada: string | null;
};

type Props = {
  cotizaciones: Cotizacion[];
  onDelete: (id: number) => void; // Unused but kept for prop compatibility
  onStatusChange: (id: number, status: string) => void;
};

// Helper para estilos de estatus tipo Figma
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

function getAllowedQuotationStatuses(currentStatus: string): string[] {
  switch (currentStatus) {
    case "Pendiente":
      return ["Pendiente", "Validada", "Rechazada"];

    // Once Validated, Approved or Rejected, the status is locked for administration.
    default:
      return [currentStatus];
  }
}

export function CotizacionesTable({ cotizaciones, onStatusChange }: Props) {
  if (cotizaciones.length === 0) {
    return (
      <div className="flex justify-center py-16 text-gray-500">No se encontraron cotizaciones.</div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded">
      <div className="space-y-2 min-w-[1100px]">
        {/* Header */}
        <div
          className="grid px-2 md:px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-xs md:text-sm text-center"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.6fr",
          }}
        >
          <span className="whitespace-nowrap">Fecha</span>
          <span className="whitespace-nowrap">Monto</span>
          <span className="whitespace-nowrap">Entrega</span>
          <span className="whitespace-nowrap">Empresa</span>
          <span className="whitespace-nowrap">Cliente</span>
          <span className="whitespace-nowrap">Folio</span>
          <span className="whitespace-nowrap">Estatus</span>
          <span className="whitespace-nowrap">Acciones</span>
        </div>

        {cotizaciones.map((c) => (
          <div
            key={c.id_cotizacion}
            className="grid px-2 md:px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-xs md:text-sm items-center text-center"
            style={{
              gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.6fr",
            }}
          >
            {/* Date */}
            <span className="whitespace-nowrap">
              {c.fecha_creacion ? formatDate(c.fecha_creacion) : "—"}
            </span>

            {/* Amount */}
            <span className="whitespace-nowrap">${c.monto_total.toLocaleString("es-MX")} MXN</span>

            {/* Delivery */}
            <span className="whitespace-nowrap">
              {c.fecha_estimada ? formatDate(c.fecha_estimada) : "—"}
            </span>

            {/* Company */}
            <span className="whitespace-nowrap">{c.empresa || "—"}</span>

            {/* Client */}
            <span className="whitespace-nowrap">{c.cliente}</span>

            {/* Folio */}
            <span className="whitespace-nowrap">{c.folio ?? "—"}</span>

            {/* Status */}
            <div className="flex justify-center">
              <div
                className={`relative flex items-center rounded-full ${getStatusStyle(c.estatus)}`}
              >
                <select
                  value={c.estatus}
                  onChange={(e) => {
                    onStatusChange(c.id_cotizacion, e.target.value);
                  }}
                  className="pl-3 md:pl-4 pr-7 md:pr-8 py-1 rounded-full text-xs md:text-sm font-medium outline-none cursor-pointer appearance-none bg-transparent whitespace-nowrap"
                >
                  {getAllowedQuotationStatuses(c.estatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <CaretDown
                  size={14}
                  weight="bold"
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center">
              <button
                className="text-black hover:text-[#e42200] transition-colors p-2"
                title="Editar cotización"
              >
                <PencilSimple size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

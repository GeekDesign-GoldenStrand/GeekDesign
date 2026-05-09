<<<<<<< HEAD
// Frontend type for a quotation entry
interface Cotizacion {
=======
"use client";

import { PencilSimple, CaretDown } from "@phosphor-icons/react";

import { formatDate } from "@/lib/utils/date";

type Cotizacion = {
>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  empresa: string | null;
  cliente: string;
<<<<<<< HEAD
  estatus: string;
  fecha_estimada: string | null;
}

// Props define the data and callbacks passed into the table
interface Props {
  cotizaciones: Cotizacion[]; // list of quotations to display
  onDelete: (id: number) => void; // callback to delete a quotation, not implemented yet
  onStatusChange: (id: number, status: string) => void; // callback to update status, not implemented yet
}

export function CotizacionesTable({ cotizaciones, onDelete, onStatusChange }: Props) {
  // Empty state: show message if there are no quotations
  if (cotizaciones.length === 0) {
    return (
      <div className="flex justify-center py-16 text-[#8e908f]">
        No se encontraron cotizaciones.
      </div>
=======
  folio: string | null;
  estatus: string;
  fecha_estimada: string | null;
};

type Props = {
  cotizaciones: Cotizacion[];
  onDelete: (id: number) => void; // no se usa pero lo dejamos para no romper props
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

export function CotizacionesTable({ cotizaciones, onStatusChange }: Props) {
  if (cotizaciones.length === 0) {
    return (
      <div className="flex justify-center py-16 text-gray-500">No se encontraron cotizaciones.</div>
>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d
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
        <span>Monto</span>
        <span>Entrega</span>
        <span>Empresa</span>
        <span>Cliente</span>
        <span>Estatus</span>
        <span>Acciones</span>
      </div>

      {/* Table rows: render one per quotation */}
      {cotizaciones.map((c) => (
        <div
          key={c.id_cotizacion}
          className="grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr" }}
        >
          {/* Basic fields */}
          <span>{new Date(c.fecha_creacion).toLocaleDateString()}</span>
          <span>${c.monto_total} MXN</span>
          <span>{c.fecha_estimada ?? "—"}</span>
          <span>{c.empresa ?? "—"}</span>
          <span>{c.cliente}</span>

          {/* Status dropdown: allows updating quotation status */}
          <select
            value={c.estatus}
            onChange={(e) => onStatusChange(c.id_cotizacion, e.target.value)}
            className="border rounded px-2 py-1 bg-white"
          >
            <option value="En_revision">En revisión</option>
            <option value="Validada">Validada</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
          </select>

          {/* Action buttons: edit and delete */}
          <div className="flex justify-center gap-2">
            <a href={`/admin/cotizaciones/${c.id_cotizacion}`} className="text-blue-600">
              Editar
            </a>
            <button onClick={() => onDelete(c.id_cotizacion)} className="text-red-600">
              Eliminar
            </button>
          </div>
        </div>
      ))}
=======
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
            {/* Fecha */}
            <span className="whitespace-nowrap">
              {c.fecha_creacion ? formatDate(c.fecha_creacion) : "—"}
            </span>

            {/* Monto */}
            <span className="whitespace-nowrap">${c.monto_total.toLocaleString("es-MX")} MXN</span>

            {/* Entrega */}
            <span className="whitespace-nowrap">
              {c.fecha_estimada ? formatDate(c.fecha_estimada) : "—"}
            </span>

            {/* Empresa */}
            <span className="whitespace-nowrap">{c.empresa || "—"}</span>

            {/* Cliente */}
            <span className="whitespace-nowrap">{c.cliente}</span>

            {/* Folio */}
            <span className="whitespace-nowrap">{c.folio ?? "—"}</span>

            {/* Estatus */}
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
                  <option value="Pendiente">Pendiente</option>
                  <option value="Validada">Validada</option>
                  <option value="Rechazada">Rechazada</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>

                <CaretDown
                  size={14}
                  weight="bold"
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            {/* Acciones */}
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
>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d
    </div>
  );
}

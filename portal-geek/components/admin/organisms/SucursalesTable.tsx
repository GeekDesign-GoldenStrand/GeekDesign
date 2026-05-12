"use client";

import { PencilSimple } from "@phosphor-icons/react";
import Link from "next/link";

// Business hours are stored as DateTime values only for DB compatibility.
// UTC prevents the browser from shifting the displayed hour based on local timezone.
function formatHour(dateString?: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

type Sucursal = {
  id_sucursal: number;
  nombre_sucursal: string;
  direccion: string;
  horario_apertura?: string | null;
  horario_salida?: string | null;
  estatus: string;
};

type Props = {
  sucursales: Sucursal[];
};

export function SucursalesTable({ sucursales }: Props) {
  if (sucursales.length === 0) {
    return (
      <div className="flex justify-center py-16 text-gray-500">No se encontraron sucursales.</div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded">
      {/* Fixed minimum width keeps the table readable on small screens while allowing horizontal scroll. */}
      <div className="space-y-2 min-w-[1100px]">
        {/* Header */}
        <div
          className="grid px-2 md:px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-xs md:text-sm text-center"
          style={{
            gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 0.6fr",
          }}
        >
          <span>Nombre</span>
          <span>Dirección</span>
          <span>Apertura</span>
          <span>Salida</span>
          <span>Estatus</span>
          <span>Acciones</span>
        </div>

        {sucursales.map((s) => (
          <div
            key={s.id_sucursal}
            className="grid px-2 md:px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-xs md:text-sm items-center text-center"
            style={{
              gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 0.6fr",
            }}
          >
            <span className="whitespace-nowrap">{s.nombre_sucursal}</span>
            <span className="whitespace-nowrap">{s.direccion}</span>

            <span>{formatHour(s.horario_apertura)}</span>

            <span>{formatHour(s.horario_salida)}</span>

            {/* Status colors match the branch form to keep active/inactive states consistent. */}
            <span
              className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${
                s.estatus === "Activo"
                  ? "bg-[#CCFFA5]/60 text-[#2A940D]"
                  : "bg-[#FFA5A5]/60 text-[#FF0000]"
              }`}
            >
              {s.estatus}
            </span>

            {/* Next Link keeps navigation client-side and avoids a full page reload. */}
            <div className="flex justify-center">
              <Link
                href={`/sucursales/${s.id_sucursal}`}
                className="text-black hover:text-[#e42200] transition-colors p-2"
                title="Editar sucursal"
              >
                <PencilSimple size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

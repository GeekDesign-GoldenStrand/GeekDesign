"use client";

import { PencilSimple } from "@phosphor-icons/react";

function formatHour(dateString?: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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
  onDelete: (id: number) => void;
};

export function SucursalesTable({ sucursales, onDelete }: Props) {
  if (sucursales.length === 0) {
    return (
      <div className="flex justify-center py-16 text-gray-500">No se encontraron sucursales.</div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded">
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

            <span>
              {formatHour(s.horario_apertura)}
            </span>

            <span>
              {formatHour(s.horario_salida)}
            </span>

            {/* Estatus */}
            <span
              className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${
                s.estatus === "Activo"
                  ? "bg-[#CCFFA5]/60 text-[#2A940D]"
                  : "bg-[#FFA5A5]/60 text-[#FF0000]"
              }`}
            >
              {s.estatus}
            </span>

            {/* Acciones */}
            <div className="flex justify-center">
              <a
                href={`/admin/sucursales/${s.id_sucursal}`}
                className="text-black hover:text-[#e42200] transition-colors p-2"
                title="Editar sucursal"
              >
                <PencilSimple size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

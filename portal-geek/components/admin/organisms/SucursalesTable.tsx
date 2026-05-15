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
    <div className="bg-transparent md:bg-white rounded">
      <div className="space-y-4 md:space-y-2">
        {/* Header - Desktop Only */}
        <div
          className="hidden md:grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
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

        {/* Rows */}
        {sucursales.map((s) => (
          <div key={s.id_sucursal}>
            {/* Desktop Row */}
            <div
              className="hidden md:grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center"
              style={{
                gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 0.6fr",
              }}
            >
              <span className="whitespace-nowrap">{s.nombre_sucursal}</span>
              <span className="truncate px-2">{s.direccion}</span>
              <span>{formatHour(s.horario_apertura)}</span>
              <span>{formatHour(s.horario_salida)}</span>
              <div className="flex justify-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                    s.estatus === "Activo"
                      ? "bg-[#CCFFA5]/60 text-[#2A940D]"
                      : "bg-[#FFA5A5]/60 text-[#FF0000]"
                  }`}
                >
                  {s.estatus}
                </span>
              </div>
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

            {/* Mobile Card */}
            <div className="md:hidden bg-white p-5 rounded-xl shadow-sm border border-[#F0F0F0] space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                    Sucursal
                  </p>
                  <p className="text-[16px] font-bold text-[#1e1e1e]">{s.nombre_sucursal}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                    s.estatus === "Activo"
                      ? "bg-[#CCFFA5]/60 text-[#2A940D]"
                      : "bg-[#FFA5A5]/60 text-[#FF0000]"
                  }`}
                >
                  {s.estatus}
                </span>
              </div>

              <div className="pt-2 border-t border-[#F5F5F5]">
                <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                  Dirección
                </p>
                <p className="text-[13px] font-medium text-[#1e1e1e] leading-relaxed">{s.direccion}</p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-[#8e908f] uppercase mb-0.5">Apertura</p>
                    <p className="text-[12px] font-bold text-[#1e1e1e]">{formatHour(s.horario_apertura)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8e908f] uppercase mb-0.5">Cierre</p>
                    <p className="text-[12px] font-bold text-[#1e1e1e]">{formatHour(s.horario_salida)}</p>
                  </div>
                </div>
                <Link
                  href={`/sucursales/${s.id_sucursal}`}
                  className="h-10 w-10 flex items-center justify-center bg-[#F5F5F5] rounded-full text-[#1e1e1e]"
                >
                  <PencilSimple size={18} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

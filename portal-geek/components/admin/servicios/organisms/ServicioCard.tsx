"use client";

import Link from "next/link";

import { EditIcon, TrashIcon } from "@/components/ui/atoms/icons";
import type { ServicioListadoItem } from "@/types/servicios";

type ServicioCardProps = {
  servicio: ServicioListadoItem;
  onEliminar?: (id: number) => void;
};

export function ServicioCard({ servicio, onEliminar }: ServicioCardProps) {
  const fechaFormateada = new Date(servicio.fecha_modificacion).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const maquinasTexto =
    servicio.maquinas.length === 0
      ? "Sin máquinas asignadas"
      : servicio.maquinas.map((m) => m.maquina.apodo_maquina).join(", ");

  return (
    <div className="bg-white gap-4 rounded-[7px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.25)] p-6 flex flex-col w-full font-['IBM_Plex_Sans_JP',sans-serif]">
      {/* Header */}
      <div>
        <div className="flex gap-6 justify-between items-start">
          <Link
            href={`/servicios/${servicio.id_servicio}`}
            className="text-[20px] font-ibm-plex font-semibold text-[#1e1e1e] hover:text-[#e42200] transition-colors break-words flex-1"
          >
            {servicio.nombre_servicio}
          </Link>

          <div className="flex gap-2 flex-none">
            <Link
              href={`/servicios/${servicio.id_servicio}/editar`}
              aria-label="Editar"
              className="flex-none flex items-center justify-center w-9 h-9 border border-dashed border-[#1e1e1e] rounded-[7px] p-2 text-[#1e1e1e] hover:bg-gray-50 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
            >
              <EditIcon />
            </Link>
            <button
              onClick={() => onEliminar?.(servicio.id_servicio)}
              aria-label="Eliminar"
              className="flex items-center justify-center w-9 h-9 border border-dashed border-[#e42200] rounded-[7px] p-2 text-[#e42200] hover:bg-[#fff5f5] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] cursor-pointer"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Body / Content */}
      <div className="space-y-1.5 text-[14px] text-[#1e1e1e] font-normal leading-relaxed">
        <p>
          <span className="font-semibold">Descripción:</span>{" "}
          {servicio.descripcion_servicio ?? "Sin descripción"}
        </p>
        <p>
          <span className="font-semibold">Máquina:</span> {maquinasTexto}
        </p>
        <p>
          <span className="font-semibold">Última fecha de modificación:</span> {fechaFormateada}
        </p>
      </div>
    </div>
  );
}

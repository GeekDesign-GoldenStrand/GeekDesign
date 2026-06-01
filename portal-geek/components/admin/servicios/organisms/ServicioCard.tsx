"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent } from "react";

import { ActionButton, ActionLink } from "@/components/ui/atoms";
import { EditIcon, TrashIcon } from "@/components/ui/atoms/icons";
import type { ServicioListadoItem } from "@/types/servicios";

type ServicioCardProps = {
  servicio: ServicioListadoItem;
  onEliminar?: (id: number) => void;
};

export function ServicioCard({ servicio, onEliminar }: ServicioCardProps) {
  const router = useRouter();

  const fechaFormateada = new Date(servicio.fecha_modificacion).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const maquinas = servicio.maquinas.map((m) => m.maquina.apodo_maquina);

  const goToEdit = () => router.push(`/servicios/${servicio.id_servicio}/editar`);

  // Keyboard parity: Enter/Space on a focused card should mirror the click.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToEdit();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToEdit}
      onKeyDown={onKeyDown}
      aria-label={`Editar ${servicio.apodo_servicio} (${servicio.nombre_servicio})`}
      className="bg-white gap-4 rounded-[7px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.25)] p-4 flex flex-col w-full min-w-0 font-['IBM_Plex_Sans_JP',sans-serif] cursor-pointer transition-shadow hover:shadow-[0px_0px_24px_0px_rgba(228,34,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200] focus-visible:ring-offset-2"
    >
      {/* Header */}
      <div>
        <h3 className="text-[20px] font-ibm-plex font-semibold text-[#1e1e1e] break-words">
          {servicio.apodo_servicio}
        </h3>
        <p className="text-[14px] font-IBM-plex-sans font-normal text-[#575757] break-words">
          {servicio.nombre_servicio}
        </p>
      </div>

      {/* Descripción */}
      <div>
        <p className="text-[16px] font-IBM-plex-sans font-medium text-[#1e1e1e] mb-1">
          Descripción
        </p>
        <p className="text-[14px] font-IBM-plex-sans font-normal text-[#1e1e1e] break-words">
          {servicio.descripcion_servicio ?? "Sin descripción"}
        </p>
      </div>

      {/* Sucursal */}
      <div>
        <p className="text-[16px] font-IBM-plex-sans font-medium text-[#1e1e1e] mb-1">Sucursal</p>
        <p className="text-[14px] font-IBM-plex-sans font-normal text-[#1e1e1e] break-words">
          {servicio.sucursal?.nombre_sucursal ?? "Sin sucursal asignada"}
        </p>
      </div>

      {/* Máquinas */}
      <div>
        <p className="text-[16px] font-IBM-plex-sans font-medium text-[#1e1e1e] mb-1">Máquinas</p>
        {maquinas.length > 0 ? (
          <div className="flex flex-wrap gap-2 flex-1">
            {maquinas.map((maq, idx) => (
              <p
                key={idx}
                className="border border-gray-400 bg-gray-100 text-xs w-fit max-w-full h-fit font-regular px-2 py-1 rounded-lg text-[#1e1e1e] break-words"
              >
                {maq}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[14px] font-IBM-plex-sans font-normal text-[#1e1e1e]">
            Sin máquinas asignadas
          </p>
        )}
      </div>

      {/* Última modificación */}
      <div>
        <p className="text-[16px] font-IBM-plex-sans font-medium text-[#1e1e1e] mb-1">
          Última modificación
        </p>
        <p className="text-[14px] font-IBM-plex-sans font-normal text-[#1e1e1e] break-words">
          {fechaFormateada}
        </p>
      </div>

      {/* Footer / Actions — stop click bubbling so these don't trigger the card-wide edit navigation */}
      <div
        className="flex items-center justify-end mt-auto pt-3 border-t border-gray-100 gap-2 flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        <ActionLink
          href={`/servicios/${servicio.id_servicio}/editar`}
          aria-label="Editar"
          icon={<EditIcon size={16} />}
        />
        <ActionButton
          tone="danger"
          onClick={() => onEliminar?.(servicio.id_servicio)}
          aria-label="Eliminar"
          icon={<TrashIcon size={16} />}
        />
      </div>
    </div>
  );
}

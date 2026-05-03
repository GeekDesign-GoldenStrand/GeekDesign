"use client";

import type { ServicioListadoItem } from "@/types/servicios";

type ServicioCardProps = {
  servicio: ServicioListadoItem;
  onVerDetalle?: (id: number) => void;
  onEliminar?: (id: number) => void;
};

export function ServicioCard({
  servicio,
  onVerDetalle,
  onEliminar,
}: ServicioCardProps) {
  //Date Format to "D de MMMM de YYYY" 
  const fechaFormateada = new Date(
    servicio.fecha_modificacion
  ).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Machines list as comma-separated string or "Sin máquinas asignadas" if empty
  const maquinasTexto =
    servicio.maquinas.length === 0
      ? "Sin máquinas asignadas"
      : servicio.maquinas.map((m) => m.maquina.apodo_maquina).join(", ");

  return (
    <div className="bg-white rounded-2xl shadow-[0px_4px_7px_0px_rgba(0,0,0,0.10)] p-6 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-[#1e1e1e] mb-2">
          {servicio.nombre_servicio}
        </h3>
        <div className="space-y-0.5 text-sm text-[#1e1e1e]">
          <p>
            <span className="font-medium">Descripción:</span>{" "}
            {servicio.descripcion_servicio ?? "Sin descripción"}
          </p>
          <p>
            <span className="font-medium">Máquina:</span> {maquinasTexto}
          </p>
          <p>
            <span className="font-medium">Última fecha de modificación:</span>{" "}
            {fechaFormateada}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <button
          type="button"
          onClick={() => onVerDetalle?.(servicio.id_servicio)}
          className="bg-gray-300 text-gray-700 hover:bg-gray-400 h-9 px-5 rounded-full font-medium text-sm transition-all"
        >
          Ver detalle
        </button>
        <button
          type="button"
          onClick={() => onEliminar?.(servicio.id_servicio)}
          className="bg-[#e42200] text-white hover:bg-[#c41e00] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] h-9 px-5 rounded-full font-medium text-sm transition-all"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
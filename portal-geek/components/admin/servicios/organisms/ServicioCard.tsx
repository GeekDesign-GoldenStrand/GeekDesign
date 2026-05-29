"use client";

import Link from "next/link";

import { Button } from "@/components/ui/atoms/Button";
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
    <div className="bg-white rounded-2xl shadow-[0px_4px_7px_0px_rgba(0,0,0,0.10)] p-6 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-[#1e1e1e] mb-2">{servicio.nombre_servicio}</h3>
        <div className="space-y-0.5 text-sm text-[#1e1e1e]">
          <p>
            <span className="font-medium">Descripción:</span>{" "}
            {servicio.descripcion_servicio ?? "Sin descripción"}
          </p>
          <p>
            <span className="font-medium">Máquina:</span> {maquinasTexto}
          </p>
          <p>
            <span className="font-medium">Última fecha de modificación:</span> {fechaFormateada}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Button asChild variant="secondary" size="sm">
          <Link href={`/servicios/${servicio.id_servicio}`}>Ver detalle</Link>
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onEliminar?.(servicio.id_servicio)}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

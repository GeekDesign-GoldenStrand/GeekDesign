"use client";

import { useEffect, useState } from "react";

import { ServiciosToolbar } from "@/components/admin/servicios/molecules/ServiciosToolBar";
import { ServicioCard } from "@/components/admin/servicios/organisms/ServicioCard";
import type { PaginatedResponse, ServicioListadoItem } from "@/types/servicios";

export function ViewServicios() {
  const [servicios, setServicios] = useState<ServicioListadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServicios() {
      try {
        const res = await fetch("/api/servicios");
        if (!res.ok) throw new Error("Error al cargar servicios");
        const json: PaginatedResponse<ServicioListadoItem> = await res.json();
        setServicios(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    fetchServicios();
  }, []);

  // Counts active services for the toolbar badge.
  const activosCount = servicios.filter((s) => s.estatus_servicio).length;

  // Card action handlers — placeholders until ADMIN-03 (delete) and detail US ship.
  const handleVerDetalle = (id: number) => {
    console.warn("TODO: Ver detalle del servicio", id);
  };

  const handleEliminar = (id: number) => {
    console.warn("TODO: Eliminar servicio", id);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-[#1e1e1e] mb-6">Servicios</h1>

      <ServiciosToolbar activosCount={activosCount} />

      {loading && <div className="text-center py-12 text-gray-500">Cargando servicios...</div>}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">{error}</div>
      )}

      {!loading && !error && servicios.length === 0 && (
        <div className="text-center py-12 text-gray-500">No hay servicios registrados todavía.</div>
      )}

      {!loading && !error && servicios.length > 0 && (
        <div className="space-y-4">
          {servicios.map((servicio) => (
            <ServicioCard
              key={servicio.id_servicio}
              servicio={servicio}
              onVerDetalle={handleVerDetalle}
              onEliminar={handleEliminar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

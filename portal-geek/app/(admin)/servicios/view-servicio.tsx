"use client";

import { useEffect, useState } from "react";

import { ServiciosToolbar } from "@/components/admin/servicios/molecules/ServiciosToolBar";
import { SuccessModal } from "@/components/ui/atoms/SuccessModal";
import { ConfirmarEliminarServicioModal } from "@/components/admin/servicios/organisms/ConfirmarEliminarServicioModal";
import { ServicioCard } from "@/components/admin/servicios/organisms/ServicioCard";
import type { PaginatedResponse, ServicioListadoItem } from "@/types/servicios";

export function ViewServicios() {
  const [servicios, setServicios] = useState<ServicioListadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [servicioAEliminar, setServicioAEliminar] = useState<{
    id: number;
    nombre: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    async function fetchServicios() {
      try {
        const res = await fetch("/api/servicios?activo=true");
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

  const activosCount = servicios.filter((s) => s.estatus_servicio).length;

  const handleVerDetalle = (id: number) => {
    console.warn("TODO: Ver detalle del servicio", id);
  };

  const handleEliminar = (id: number) => {
    const servicio = servicios.find((s) => s.id_servicio === id);
    if (!servicio) return;
    setDeleteError(null);
    setServicioAEliminar({ id, nombre: servicio.nombre_servicio });
  };

  async function handleDeleteConfirm() {
    if (!servicioAEliminar) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/servicios/${servicioAEliminar.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setDeleteError((payload as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      setServicios((prev) => prev.filter((s) => s.id_servicio !== servicioAEliminar.id));
      setServicioAEliminar(null);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-[#1e1e1e] mb-6">Servicios</h1>

      <ServiciosToolbar activosCount={activosCount} />

      {deleteSuccess && (
        <div className="mb-4">
          <SuccessModal message="Servicio eliminado correctamente." />
        </div>
      )}

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

      <ConfirmarEliminarServicioModal
        isOpen={servicioAEliminar !== null}
        servicioNombre={servicioAEliminar?.nombre ?? ""}
        loading={deleteLoading}
        serverError={deleteError}
        onClose={() => setServicioAEliminar(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmarEliminarServicioModal } from "@/components/admin/servicios/molecules/ConfirmarEliminarServicioModal";
import { ServiciosToolbar } from "@/components/admin/servicios/molecules/ServiciosToolBar";
import { ServicioCard } from "@/components/admin/servicios/organisms/ServicioCard";
import type { PaginatedResponse, ServicioListadoItem } from "@/types/servicios";

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<ServicioListadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state. Tracks which servicio is being deleted, plus loading/error
  // for the DELETE call. Set to null when the modal should be closed.
  const [servicioAEliminar, setServicioAEliminar] = useState<ServicioListadoItem | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState<string | null>(null);

  const fetchServicios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/servicios");
      if (!res.ok) throw new Error("Error al cargar servicios");
      const json: PaginatedResponse<ServicioListadoItem> = await res.json();
      setServicios(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  // Counts active services for the toolbar badge.
  const activosCount = servicios.filter((s) => s.estatus_servicio).length;

  // Open the modal for the picked service. Clear any previous error from a prior attempt.
  const handleEliminar = (id: number) => {
    const servicio = servicios.find((s) => s.id_servicio === id);
    if (!servicio) return;
    setServicioAEliminar(servicio);
    setErrorEliminacion(null);
  };

  // Close modal and clear state.
  const closeModal = () => {
    if (eliminando) return; // don't allow closing mid-request
    setServicioAEliminar(null);
    setErrorEliminacion(null);
  };

  // Confirm deletion: call the API, refresh the list on success,
  // show server error on the modal otherwise (e.g. 409 referenced).
  const confirmarEliminar = async () => {
    if (!servicioAEliminar) return;
    setEliminando(true);
    setErrorEliminacion(null);

    try {
      const res = await fetch(`/api/servicios/${servicioAEliminar.id_servicio}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Error al eliminar el servicio");
      }

      // Success — close modal and refetch.
      setServicioAEliminar(null);
      await fetchServicios();
    } catch (err) {
      setErrorEliminacion(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEliminando(false);
    }
  };

  const handleVerDetalle = (id: number) => {
    console.warn("TODO: Ver detalle del servicio", id);
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

      <ConfirmarEliminarServicioModal
        isOpen={servicioAEliminar !== null}
        servicioName={servicioAEliminar?.nombre_servicio ?? ""}
        loading={eliminando}
        serverError={errorEliminacion}
        onClose={closeModal}
        onConfirm={confirmarEliminar}
      />
    </div>
  );
}
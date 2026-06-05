"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { ConfirmarEliminarServicioModal } from "@/components/admin/servicios/organisms/ConfirmarEliminarServicioModal";
import { ServicioCard } from "@/components/admin/servicios/organisms/ServicioCard";
import { SuccessModal } from "@/components/ui/atoms/SuccessModal";
import type { PaginatedResponse } from "@/types";
import type { ServicioListadoItem } from "@/types/servicios";

export function ViewServicios() {
  const router = useRouter();
  const [servicios, setServicios] = useState<ServicioListadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 10;

  // Search state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [servicioAEliminar, setServicioAEliminar] = useState<{
    id: number;
    nombre: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Debounce the search input so we don't refetch on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    // El flag `active` descarta la respuesta si el efecto se reejecuta (nueva
    // búsqueda/página) antes de que termine este fetch, evitando que una
    // respuesta obsoleta sobrescriba los resultados más recientes.
    let active = true;

    async function fetchServicios() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          activo: "true",
        });
        if (debouncedSearch.trim().length > 0) params.set("q", debouncedSearch.trim());

        const res = await fetch(`/api/servicios?${params}`);
        if (!res.ok) throw new Error("Error al cargar servicios");
        const json: PaginatedResponse<ServicioListadoItem> = await res.json();
        if (!active) return;

        // La búsqueda se aplica sobre TODOS los registros en el servidor. Si la
        // página actual quedó fuera de rango tras filtrar, acota a la última
        // válida en lugar de saltar a la 1: el cambio de `page` dispara un
        // refetch que traerá datos.
        const totalPages = Math.max(1, Math.ceil(json.total / pageSize));
        if (page > totalPages) {
          setPage(totalPages);
          return;
        }

        setServicios(json.data);
        setTotal(json.total);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchServicios();

    return () => {
      active = false;
    };
  }, [page, refreshKey, debouncedSearch]);

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
      setTotal((prev) => Math.max(0, prev - 1));
      setServicioAEliminar(null);
      setDeleteSuccess(true);
      if (page > 1 && servicios.length === 1) {
        setPage((p) => p - 1);
      } else {
        setRefreshKey((prev) => prev + 1);
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="px-8 pt-6 pb-4">
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar servicio..."
        onAgregar={() => router.push("/servicios/nuevoServicio")}
      />

      {deleteSuccess && (
        <SuccessModal
          message="Servicio eliminado correctamente."
          onClose={() => setDeleteSuccess(false)}
        />
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500 font-ibm-plex text-[14px]">
          Cargando servicios...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md font-ibm-plex text-[14px]">
          {error}
        </div>
      )}

      {!loading && !error && servicios.length === 0 && (
        <div className="text-center py-12 text-gray-500 font-ibm-plex text-[14px]">
          No hay servicios registrados todavía.
        </div>
      )}

      {!loading && !error && servicios.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {servicios.map((servicio) => (
              <ServicioCard
                key={servicio.id_servicio}
                servicio={servicio}
                onEliminar={handleEliminar}
              />
            ))}
          </div>

          <div className="flex justify-end mt-8 mb-6 pr-4 font-ibm-plex">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="w-[36px] h-[36px] border border-gray-300 rounded-[4px] flex items-center justify-center text-[#1e1e1e] hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                {"<"}
              </button>

              {Array.from({ length: totalPages }, (_, i) => {
                const pageNumber = i + 1;
                const isActive = pageNumber === page;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`w-[36px] h-[36px] rounded-[4px] font-bold text-[15px] cursor-pointer
                    ${
                      isActive
                        ? "bg-[#e42200] text-white"
                        : "bg-gray-100 text-[#1e1e1e] hover:bg-gray-200"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(page + 1)}
                className="w-[36px] h-[36px] border border-gray-300 rounded-[4px] flex items-center justify-center text-[#1e1e1e] hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                {">"}
              </button>
            </div>
          </div>
        </>
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

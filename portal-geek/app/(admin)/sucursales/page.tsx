"use client";

import { useState, useEffect, useCallback } from "react";

import { SucursalesTemplate } from "@/components/admin/templates/SucursalesTemplate";

type Sucursal = {
  id_sucursal: number;
  nombre_sucursal: string;
  direccion: string;
  horario_apertura?: string | null;
  horario_salida?: string | null;
  estatus: string;
};

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 10;

  // Filters are kept in the page container so the template stays focused on layout and UI.
  const [filterNombre, setFilterNombre] = useState("");
  const [filterDireccion, setFilterDireccion] = useState("");
  const [filterEstatus, setFilterEstatus] = useState<string[]>([]);

  const fetchSucursales = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      // Query params keep pagination, search, and filters reflected in a single API contract.
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      if (search) params.set("search", search);
      if (filterNombre) params.set("nombre", filterNombre);
      if (filterDireccion) params.set("direccion", filterDireccion);

      // Multiple status values are appended because the API supports filtering by more than one status.
      filterEstatus.forEach((e) => params.append("estatus", e));

      const res = await fetch(`/api/sucursales?${params.toString()}`);
      const json = await res.json();

      setSucursales(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      console.error("Error cargando sucursales");
    }
  }, [page, search, filterNombre, filterDireccion, filterEstatus]);

  useEffect(() => {
    const load = async () => {
      await fetchSucursales();
    };

    load();
  }, [fetchSucursales]);

  async function handleDelete(id: number) {
    // The DELETE endpoint performs a soft delete, so refreshing hides the inactive branch from the table.
    await fetch(`/api/sucursales/${id}`, { method: "DELETE" });

    fetchSucursales();
  }

  return (
    <SucursalesTemplate
      sucursales={sucursales}
      search={search}
      setSearch={setSearch}
      page={page}
      setPage={setPage}
      total={total}
      onDelete={handleDelete}
      filterNombre={filterNombre}
      setFilterNombre={setFilterNombre}
      filterDireccion={filterDireccion}
      setFilterDireccion={setFilterDireccion}
      filterEstatus={filterEstatus}
      setFilterEstatus={setFilterEstatus}
    />
  );
}

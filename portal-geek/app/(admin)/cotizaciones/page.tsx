"use client";

import { Plus, Funnel, MagnifyingGlass } from "@phosphor-icons/react";
import { useState, useEffect, useCallback, useRef } from "react";

import { CotizacionesTemplate } from "@/components/admin/templates/CotizacionesTemplate";

// Frontend type for a quotation entry
type Cotizacion = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  empresa: string | null;
  cliente: string;
  estatus: string;
  fecha_estimada: string | null;
};

// Raw API response type (avoids using any)
type CotizacionApi = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: string | number;
  empresa_cliente?: string | null;
  cliente?: { empresa?: string | null; nombre_cliente?: string };
  estatus?: { descripcion?: string };
  fecha_fin?: string | null;
  fecha_aprobacion?: string | null;
}

export default function CotizacionesPage() {
  // Local state for quotations list and pagination/search controls
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 13;

  // Filter states (client, company, status)
  const [filterCliente, setFilterCliente] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("");
  const [filterEstatus, setFilterEstatus] = useState<string[]>([]);

  // Fetch quotations from API with filters and pagination
  const fetchCotizaciones = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      if (search) params.set("search", search);
      if (filterCliente) params.set("cliente", filterCliente);
      if (filterEmpresa) params.set("empresa", filterEmpresa);
      filterEstatus.forEach((e) => params.append("estatus", e));

      const res = await fetch(`/api/cotizaciones?${params.toString()}`);
      const json = await res.json();

      // Map raw API response into frontend-friendly type
      const mapped: Cotizacion[] = (json.data ?? []).map((c: CotizacionApi) => ({
        id_cotizacion: c.id_cotizacion,
        fecha_creacion: c.fecha_creacion,
        monto_total: Number(c.monto_total),
        empresa: c.empresa_cliente ?? c.cliente?.empresa ?? null,
        cliente: c.cliente?.nombre_cliente ?? "",
        estatus: c.estatus?.descripcion ?? "",
        fecha_estimada: c.fecha_fin ?? c.fecha_aprobacion ?? null,
      }));

      setCotizaciones(mapped);
      setTotal(json.total ?? 0);
    } catch {
      console.error("Error loading quotations");
    }
  }, [search, page, filterCliente, filterEmpresa, filterEstatus]);

  // Effect: reload quotations whenever filters or pagination change
  useEffect(() => {
    async function load() {
      await fetchCotizaciones();
    }
    load();
  }, [fetchCotizaciones]);

  // Delete a quotation and refresh list
  async function handleDelete(id: number) {
    await fetch(`/api/cotizaciones/${id}`, { method: "DELETE" });
    fetchCotizaciones();
  }

  // Update quotation status and refresh list
  async function handleStatusChange(id: number, status: string) {
    await fetch(`/api/cotizaciones/${id}/estatus`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estatus: status }),
    });
    fetchCotizaciones();
  }

  // Render template with data, search, filters, and pagination
  return (
    <CotizacionesTemplate
      cotizaciones={cotizaciones}
      search={search}
      setSearch={setSearch}
      onDelete={handleDelete}
      onStatusChange={handleStatusChange}
      page={page}
      setPage={setPage}
      total={total}
      filterCliente={filterCliente}
      setFilterCliente={setFilterCliente}
      filterEmpresa={filterEmpresa}
      setFilterEmpresa={setFilterEmpresa}
      filterEstatus={filterEstatus}
      setFilterEstatus={setFilterEstatus}
    />
  );
}

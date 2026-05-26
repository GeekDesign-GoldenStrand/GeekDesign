"use client";

import { useState, useEffect, useCallback } from "react";

import { CotizacionesTemplate } from "@/components/admin/templates/CotizacionesTemplate";

// Frontend type for a quotation entry
type Cotizacion = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  empresa: string | null;
  cliente: string;
  folio: string | null;
  nombre_oportunidad: string | null;
  estatus: string;
  fecha_estimada: string | null;
  // Non-placeholder design files attached to any line item of this cotización.
  archivos: { id: number; nombre: string }[];
};

// Raw API response type (avoids using any)
type CotizacionApi = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: string | number;
  empresa_cliente?: string | null;
  cliente?: { empresa?: string | null; nombre_cliente?: string };
  folio?: string | null;
  nombre_oportunidad?: string | null;
  estatus?: { descripcion?: string };
  fecha_fin?: string | null;
  fecha_aprobacion?: string | null;
  pedido?: {
    detalles?: {
      archivo?: { id_archivo: number; nombre_archivo: string; url_archivo: string } | null;
    }[];
  } | null;
};

type ClienteApi = { id_cliente: number; nombre_cliente: string };

export default function CotizacionesPage() {
  // Local state for quotations list and pagination/search controls
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 13;

  // Filter states (client, company, status, fecha_fin range)
  const [filterCliente, setFilterCliente] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("");
  const [filterEstatus, setFilterEstatus] = useState<string[]>([]);
  const [filterFechaFinDesde, setFilterFechaFinDesde] = useState("");
  const [filterFechaFinHasta, setFilterFechaFinHasta] = useState("");

  // Clients catalog used by the filter sidebar dropdown
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);

  // Load clients once on mount for the filter dropdown
  useEffect(() => {
    async function loadClientes() {
      try {
        const res = await fetch(`/api/clientes?page=1&pageSize=100`);
        const json = await res.json();
        const mapped = (json.data ?? []).map((c: ClienteApi) => ({
          id: c.id_cliente,
          nombre: c.nombre_cliente,
        }));
        setClientes(mapped);
      } catch {
        console.error("Error loading clients");
      }
    }
    loadClientes();
  }, []);

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
      if (filterFechaFinDesde) params.set("fechaFinDesde", filterFechaFinDesde);
      if (filterFechaFinHasta) params.set("fechaFinHasta", filterFechaFinHasta);

      const res = await fetch(`/api/cotizaciones?${params.toString()}`);
      const json = await res.json();

      // Map raw API response into frontend-friendly type
      const mapped: Cotizacion[] = (json.data ?? []).map((c: CotizacionApi) => ({
        id_cotizacion: c.id_cotizacion,
        fecha_creacion: c.fecha_creacion,
        monto_total: Number(c.monto_total),
        empresa: c.empresa_cliente ?? c.cliente?.empresa ?? null,
        cliente: c.cliente?.nombre_cliente ?? "",
        folio: c.folio ?? null,
        nombre_oportunidad: c.nombre_oportunidad ?? null,
        estatus: c.estatus?.descripcion ?? "",
        fecha_estimada: c.fecha_fin ?? c.fecha_aprobacion ?? null,
        archivos: (c.pedido?.detalles ?? [])
          .map((d) => d.archivo)
          .filter(
            (a): a is { id_archivo: number; nombre_archivo: string; url_archivo: string } =>
              a != null && a.url_archivo !== "__PLACEHOLDER__"
          )
          .map((a) => ({ id: a.id_archivo, nombre: a.nombre_archivo })),
      }));

      setCotizaciones(mapped);
      setTotal(json.total ?? 0);
    } catch {
      console.error("Error loading quotations");
    }
  }, [
    search,
    page,
    filterCliente,
    filterEmpresa,
    filterEstatus,
    filterFechaFinDesde,
    filterFechaFinHasta,
  ]);

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
      clientes={clientes}
      filterCliente={filterCliente}
      setFilterCliente={setFilterCliente}
      filterEmpresa={filterEmpresa}
      setFilterEmpresa={setFilterEmpresa}
      filterEstatus={filterEstatus}
      setFilterEstatus={setFilterEstatus}
      filterFechaFinDesde={filterFechaFinDesde}
      setFilterFechaFinDesde={setFilterFechaFinDesde}
      filterFechaFinHasta={filterFechaFinHasta}
      setFilterFechaFinHasta={setFilterFechaFinHasta}
    />
  );
}

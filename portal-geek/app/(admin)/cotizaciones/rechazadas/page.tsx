"use client";

import { useState, useEffect, useCallback } from "react";

import { CotizacionesTemplate } from "@/components/admin/templates/CotizacionesTemplate";

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
  archivos: { id: number; nombre: string }[];
};

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

const LOST_STATUS_OPTIONS = [
  { label: "Rechazada", value: "Rechazada" },
  { label: "Cancelada", value: "Cancelada" },
];

const DEFAULT_LOST_STATUSES = LOST_STATUS_OPTIONS.map((status) => status.value);

export default function CotizacionesRechazadasPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterCliente, setFilterCliente] = useState("");
  const [filterEstatus, setFilterEstatus] = useState<string[]>(DEFAULT_LOST_STATUSES);
  const [filterFechaFinDesde, setFilterFechaFinDesde] = useState("");
  const [filterFechaFinHasta, setFilterFechaFinHasta] = useState("");

  const pageSize = 13;

  const fetchCotizaciones = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      const statusesToQuery = filterEstatus.length > 0 ? filterEstatus : DEFAULT_LOST_STATUSES;
      statusesToQuery.forEach((status) => params.append("estatus", status));
      if (search) params.set("search", search);
      if (filterCliente) params.set("cliente", filterCliente);
      if (filterFechaFinDesde) params.set("fechaFinDesde", filterFechaFinDesde);
      if (filterFechaFinHasta) params.set("fechaFinHasta", filterFechaFinHasta);

      const res = await fetch(`/api/cotizaciones?${params.toString()}`);
      const json = await res.json();

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
      console.error("Error loading lost opportunities");
    }
  }, [search, page, filterCliente, filterEstatus, filterFechaFinDesde, filterFechaFinHasta]);

  useEffect(() => {
    async function load() {
      await fetchCotizaciones();
    }
    load();
  }, [fetchCotizaciones]);

  return (
    <CotizacionesTemplate
      title="Oportunidades Perdidas"
      cotizaciones={cotizaciones}
      search={search}
      setSearch={(value) => {
        setSearch(value);
        setPage(1);
      }}
      onDelete={() => {}}
      onStatusChange={() => {}}
      page={page}
      setPage={setPage}
      total={total}
      filterCliente={filterCliente}
      setFilterCliente={(value) => {
        setFilterCliente(value);
        setPage(1);
      }}
      filterEstatus={filterEstatus}
      setFilterEstatus={(value) => {
        setFilterEstatus(value);
        setPage(1);
      }}
      filterFechaFinDesde={filterFechaFinDesde}
      setFilterFechaFinDesde={(value) => {
        setFilterFechaFinDesde(value);
        setPage(1);
      }}
      filterFechaFinHasta={filterFechaFinHasta}
      setFilterFechaFinHasta={(value) => {
        setFilterFechaFinHasta(value);
        setPage(1);
      }}
      isArchive={true}
      statusOptions={LOST_STATUS_OPTIONS}
      resetEstatus={DEFAULT_LOST_STATUSES}
    />
  );
}

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
  estatus: string;
  fecha_estimada: string | null;
};

type CotizacionApi = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: string | number;
  empresa_cliente?: string | null;
  cliente?: { empresa?: string | null; nombre_cliente?: string };
  folio?: string | null;
  estatus?: { descripcion?: string };
  fecha_fin?: string | null;
  fecha_aprobacion?: string | null;
};

export default function CotizacionesRechazadasPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 13;

  const fetchCotizaciones = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("estatus", "Rechazada"); // Force rejected status
      if (search) params.set("search", search);

      const res = await fetch(`/api/cotizaciones?${params.toString()}`);
      const json = await res.json();

      const mapped: Cotizacion[] = (json.data ?? []).map((c: CotizacionApi) => ({
        id_cotizacion: c.id_cotizacion,
        fecha_creacion: c.fecha_creacion,
        monto_total: Number(c.monto_total),
        empresa: c.empresa_cliente ?? c.cliente?.empresa ?? null,
        cliente: c.cliente?.nombre_cliente ?? "",
        folio: c.folio ?? null,
        estatus: c.estatus?.descripcion ?? "",
        fecha_estimada: c.fecha_fin ?? c.fecha_aprobacion ?? null,
      }));

      setCotizaciones(mapped);
      setTotal(json.total ?? 0);
    } catch {
      console.error("Error loading rejected quotations");
    }
  }, [search, page]);

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
      setSearch={setSearch}
      onDelete={() => {}}
      onStatusChange={() => {}}
      page={page}
      setPage={setPage}
      total={total}
      filterCliente=""
      setFilterCliente={() => {}}
      filterEmpresa=""
      setFilterEmpresa={() => {}}
      filterEstatus={["Rechazada"]}
      setFilterEstatus={() => {}}
      isArchive={true}
    />
  );
}

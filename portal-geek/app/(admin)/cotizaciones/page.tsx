"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { CotizacionesTemplate } from "@/components/admin/templates/CotizacionesTemplate";
import { ConfirmDialog } from "@/components/ui/atoms/ConfirmDialog";
import { QUOTATION_STATUS } from "@/types/cotizacion";

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

export default function CotizacionesPage() {
  // Local state for quotations list and pagination/search controls
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 13;

  // Filter states (client, status, fecha_fin range)
  const [filterCliente, setFilterCliente] = useState("");
  const [filterEstatus, setFilterEstatus] = useState<string[]>([]);
  const [filterFechaFinDesde, setFilterFechaFinDesde] = useState("");
  const [filterFechaFinHasta, setFilterFechaFinHasta] = useState("");

  // Buscar/filtrar mientras estás en la página N dispara dos fetches casi a la
  // vez (uno con la página vieja, otro tras acotarla). Este contador asegura que
  // solo la respuesta más reciente actualice el estado, evitando que una página
  // vacía (obsoleta) sobrescriba los resultados de la búsqueda.
  const requestIdRef = useRef(0);

  // Fetch quotations from API with filters and pagination
  const fetchCotizaciones = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      if (search) params.set("search", search);
      if (filterCliente) params.set("cliente", filterCliente);
      filterEstatus.forEach((e) => params.append("estatus", e));
      if (filterFechaFinDesde) params.set("fechaFinDesde", filterFechaFinDesde);
      if (filterFechaFinHasta) params.set("fechaFinHasta", filterFechaFinHasta);

      const res = await fetch(`/api/cotizaciones?${params.toString()}`);
      const json = await res.json();

      // Descarta la respuesta si ya se disparó una petición más reciente.
      if (reqId !== requestIdRef.current) return;

      // La búsqueda/filtros se aplican sobre TODOS los registros en el servidor.
      // Si la página actual quedó fuera de rango tras filtrar, acota a la última
      // válida en lugar de saltar a la 1: el cambio de `page` dispara un refetch
      // que traerá datos. (Este setState ocurre tras el await, no de forma
      // síncrona en un efecto, así que no infringe la regla de hooks.)
      const nextTotal = json.total ?? 0;
      const totalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      if (page > totalPages) {
        setPage(totalPages);
        return;
      }

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
      setTotal(nextTotal);
    } catch {
      console.error("Error loading quotations");
    }
  }, [search, page, filterCliente, filterEstatus, filterFechaFinDesde, filterFechaFinHasta]);

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

  // ─── Status-change confirmation ──────────────────────────────────────────
  // Mirrors the detail page (CotizacionDetailPage): the picker opens a
  // ConfirmDialog and the PATCH only fires on explicit confirm. The current
  // status is captured at pick-time so a background list refetch can't make
  // the "de X a Y" description go stale mid-confirm.
  const [pending, setPending] = useState<{
    id: number;
    nextStatus: string;
    currentStatus: string;
  } | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const handleStatusPicked = useCallback(
    (id: number, nextStatus: string) => {
      setStatusError(null);
      // Resolve the current status from local state at pick-time. If the row
      // can't be located (very rare — list got refetched between render and
      // click) we fall back to "—" so the dialog stays renderable.
      const row = cotizaciones.find((c) => c.id_cotizacion === id);
      setPending({ id, nextStatus, currentStatus: row?.estatus ?? "—" });
    },
    [cotizaciones]
  );

  const handleConfirmStatus = useCallback(async () => {
    if (!pending) return;
    setIsChangingStatus(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/cotizaciones/${pending.id}/estatus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus: pending.nextStatus }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const fallback =
          res.status === 404
            ? "Cotización no encontrada"
            : res.status === 403
              ? "Sin permisos para cambiar el estatus"
              : res.status === 409
                ? "Transición de estatus no permitida"
                : "No se pudo cambiar el estatus";
        setStatusError(payload.error ?? fallback);
        return;
      }
      await fetchCotizaciones();
      setPending(null);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Error de red al cambiar estatus");
    } finally {
      setIsChangingStatus(false);
    }
  }, [pending, fetchCotizaciones]);

  const handleCancelStatus = useCallback(() => {
    if (isChangingStatus) return; // don't close mid-PATCH
    setPending(null);
    setStatusError(null);
  }, [isChangingStatus]);

  // Render template with data, search, filters, and pagination
  return (
    <>
      <CotizacionesTemplate
        cotizaciones={cotizaciones}
        search={search}
        setSearch={setSearch}
        onDelete={handleDelete}
        onStatusChange={handleStatusPicked}
        page={page}
        setPage={setPage}
        total={total}
        filterCliente={filterCliente}
        setFilterCliente={setFilterCliente}
        filterEstatus={filterEstatus}
        setFilterEstatus={setFilterEstatus}
        filterFechaFinDesde={filterFechaFinDesde}
        setFilterFechaFinDesde={setFilterFechaFinDesde}
        filterFechaFinHasta={filterFechaFinHasta}
        setFilterFechaFinHasta={setFilterFechaFinHasta}
      />
      {pending && (
        <ConfirmDialog
          isOpen={true}
          // Rechazada is destructive (the cotización exits the active funnel
          // and lands in the rechazadas list); use the danger variant so the
          // visual matches the consequence. Validada (and any future forward
          // step) → primary variant, which renders in the brand red.
          variant={pending.nextStatus === QUOTATION_STATUS.RECHAZADA ? "danger" : "primary"}
          title={`Cambiar estatus a ${pending.nextStatus}`}
          description={
            <>
              Esta cotización pasará de <strong>{pending.currentStatus}</strong> a{" "}
              <strong>{pending.nextStatus}</strong>. ¿Continuar?
            </>
          }
          confirmLabel="Confirmar"
          loading={isChangingStatus}
          error={statusError}
          onConfirm={handleConfirmStatus}
          onClose={handleCancelStatus}
        />
      )}
    </>
  );
}

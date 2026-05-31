"use client";

import { useState, useEffect, useCallback } from "react";

import type { PedidoServiceOption } from "@/components/admin/molecules/PedidosServiceTabs";
import type { ServiceStatusSummary } from "@/components/admin/molecules/ServiceStatusSemaphore";
import { PedidosTemplate } from "@/components/admin/templates/PedidosTemplate";
import { SuccessModal } from "@/components/ui/atoms/SuccessModal";
import type { UserRole } from "@/types";

interface PedidoDetalle {
  id_detalle: number;
  id_servicio: number;

  estatus?: {
    descripcion: string;
  } | null;

  servicio?: {
    nombre_servicio: string;
  };
}

// Frontend type for a single order (pedido)
interface Pedido {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  monto_total?: number | null;
  folio?: string | null;
  nombre_oportunidad?: string | null;

  cliente: {
    nombre_cliente: string;
    empresa?: string | null;
  };

  estatus: {
    descripcion: string;
  };

  estado_factura?: {
    descripcion: string;
  } | null;

  detalles?: PedidoDetalle[];
  serviceStatusSummary?: ServiceStatusSummary;
  archivos: { id: number; nombre: string }[];
}

// Raw API response type
interface PedidoApi {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  nombre_oportunidad?: string | null;

  cotizaciones?: {
    folio?: string | null;
    monto_total: string | number;
  }[];

  cliente: {
    nombre_cliente: string;
    empresa?: string | null;
  };

  estatus: {
    descripcion: string;
  };

  estado_factura?: {
    descripcion: string;
  } | null;

  detalles?: Array<
    PedidoDetalle & {
      archivo?: {
        id_archivo: number;
        nombre_archivo: string;
        url_archivo: string;
      } | null;
    }
  >;

  serviceStatusSummary?: ServiceStatusSummary;
}

interface Props {
  role: UserRole;
}

export function PedidosView({ role }: Props) {
  // Local state for orders list and pagination/search controls
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter states (service IDs from tabs, client/company search, fecha range)
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [clienteEmpresa, setClienteEmpresa] = useState<string | null>(null);
  const [estatuses, setEstatuses] = useState<string[]>([]);
  const [fechaEstimadaDesde, setFechaEstimadaDesde] = useState("");
  const [fechaEstimadaHasta, setFechaEstimadaHasta] = useState("");
  const [detalleEstatuses, setDetalleEstatuses] = useState<string[]>([]);

  const pageSize = 10;

  const [services, setServices] = useState<PedidoServiceOption[]>([]);

  // Reset to page 1 whenever a filter or the search query changes — see the
  // matching effect in cotizaciones/page.tsx for the rationale.
  useEffect(() => {
    if (page !== 1) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    serviceIds,
    clienteEmpresa,
    estatuses,
    fechaEstimadaDesde,
    fechaEstimadaHasta,
    detalleEstatuses,
  ]);

  // Fetch orders from API with filters and pagination
  const fetchPedidos = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      if (estatuses.length > 0) {
        estatuses.forEach((e) => params.append("estatus", e));
      } else {
        params.set("onlyActive", "true");
      }

      if (search) params.set("search", search);

      serviceIds.forEach((id) => params.append("serviceId", id.toString()));

      if (clienteEmpresa) params.set("clienteEmpresa", clienteEmpresa);
      if (fechaEstimadaDesde) params.set("fechaEstimadaDesde", fechaEstimadaDesde);
      if (fechaEstimadaHasta) params.set("fechaEstimadaHasta", fechaEstimadaHasta);
      // Detail-status filter is only meaningful when a service is selected.
      if (serviceIds.length > 0) {
        detalleEstatuses.forEach((e) => params.append("detalleEstatus", e));
      }

      const res = await fetch(`/api/pedidos?${params.toString()}`);
      const json = await res.json();

      // Map API response into frontend-friendly structure
      const mapped: Pedido[] = (json.data ?? []).map((p: PedidoApi) => ({
        id_pedido: p.id_pedido,
        fecha_creacion: p.fecha_creacion,
        fecha_estimada: p.fecha_estimada ?? null,
        folio: p.cotizaciones?.[0]?.folio ?? null,
        nombre_oportunidad: p.nombre_oportunidad ?? null,
        // Take latest quotation amount if it exists
        monto_total: p.cotizaciones?.[0] ? Number(p.cotizaciones[0].monto_total) : null,
        cliente: p.cliente,
        estatus: p.estatus,
        estado_factura: p.estado_factura ?? null,
        detalles: p.detalles ?? [],
        serviceStatusSummary: p.serviceStatusSummary,

        archivos: (p.detalles ?? [])
          .map((d) => d.archivo)
          .filter(
            (a): a is { id_archivo: number; nombre_archivo: string; url_archivo: string } =>
              a != null && a.url_archivo !== "__PLACEHOLDER__"
          )
          .map((a) => ({ id: a.id_archivo, nombre: a.nombre_archivo })),
      }));

      setPedidos(mapped);
      setTotal(json.total ?? 0);
    } catch {
      console.error("Error loading orders");
    }
  }, [
    page,
    search,
    serviceIds,
    clienteEmpresa,
    estatuses,
    fechaEstimadaDesde,
    fechaEstimadaHasta,
    detalleEstatuses,
  ]);

  // Effect: reload orders whenever filters or pagination change
  useEffect(() => {
    async function load() {
      await fetchPedidos();
    }

    load();
  }, [fetchPedidos]);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch("/api/pedidos/servicios");

        if (!res.ok) {
          throw new Error("Error loading services");
        }

        const json = await res.json();

        setServices(json.data ?? []);
      } catch {
        console.error("Error loading pedido services");
      }
    }

    fetchServices();
  }, []);

  // Delete an order and refresh list
  async function handleDelete(id: number) {
    await fetch(`/api/pedidos/${id}`, { method: "DELETE" });
    fetchPedidos();
  }

  // Update order status and refresh list
  async function handleStatusChange(id: number, status: string) {
    try {
      const res = await fetch(`/api/pedidos/${id}/estatus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus: status }),
      });
      if (res.ok) {
        setSuccessMessage("Estatus del pedido actualizado exitosamente");
      } else {
        setErrorMessage("No se pudo actualizar el estatus del pedido");
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("No se pudo actualizar el estatus del pedido");
    }

    fetchPedidos();
  }

  function handleServiceSelect(id: number | null) {
    setPage(1);
    setServiceIds(id === null ? [] : [id]);
    // Detail status options are service-specific; clear any prior selection
    // so the next service starts with no inherited filter.
    setDetalleEstatuses([]);
  }

  async function handleDetalleStatusChange(detalleIds: number[], status: string) {
    try {
      const res = await Promise.all(
        detalleIds.map((id) =>
          fetch(`/api/pedidos/detalles/${id}/estatus`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ estatus: status }),
          })
        )
      );
      if (res.every((r) => r.ok)) {
        setSuccessMessage("Estatus del servicio actualizado exitosamente");
      } else {
        setErrorMessage("No se pudo actualizar el estatus del servicio");
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("No se pudo actualizar el estatus del servicio");
    }

    fetchPedidos();
  }

  // Render template with data, search, filters, pagination, and user role
  return (
    <>
      <PedidosTemplate
        role={role}
        pedidos={pedidos}
        search={search}
        setSearch={setSearch}
        page={page}
        setPage={setPage}
        total={total}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        clienteEmpresa={clienteEmpresa}
        setClienteEmpresa={setClienteEmpresa}
        estatuses={estatuses}
        setEstatuses={setEstatuses}
        fechaEstimadaDesde={fechaEstimadaDesde}
        setFechaEstimadaDesde={setFechaEstimadaDesde}
        fechaEstimadaHasta={fechaEstimadaHasta}
        setFechaEstimadaHasta={setFechaEstimadaHasta}
        detalleEstatuses={detalleEstatuses}
        setDetalleEstatuses={setDetalleEstatuses}
        services={services}
        selectedServiceId={serviceIds.length === 1 ? serviceIds[0] : null}
        onServiceSelect={handleServiceSelect}
        onDetalleStatusChange={handleDetalleStatusChange}
        title="Pedidos"
        historyButtonHref="/pedidos/finalizados"
        historyButtonLabel="Pedidos Completados / Cancelados"
        showServiceTabs={true}
      />
      {successMessage && (
        <SuccessModal message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
      {errorMessage && (
        <SuccessModal
          variant="error"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </>
  );
}

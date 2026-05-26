"use client";

import { useState, useEffect, useCallback } from "react";

import type { PedidoServiceOption } from "@/components/admin/molecules/PedidosServiceTabs";
import type { ServiceStatusSummary } from "@/components/admin/molecules/ServiceStatusSemaphore";
import { PedidosTemplate } from "@/components/admin/templates/PedidosTemplate";
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

type ClienteApi = { id_cliente: number; nombre_cliente: string };

export function PedidosView({ role }: Props) {
  // Local state for orders list and pagination/search controls
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter states (service IDs from tabs, company, client, fecha range)
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [cliente, setCliente] = useState<string | null>(null);
  const [fechaEstimadaDesde, setFechaEstimadaDesde] = useState("");
  const [fechaEstimadaHasta, setFechaEstimadaHasta] = useState("");

  const pageSize = 10;

  const [services, setServices] = useState<PedidoServiceOption[]>([]);
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

  // Fetch orders from API with filters and pagination
  const fetchPedidos = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("onlyActive", "true");

      if (search) params.set("search", search);

      serviceIds.forEach((id) => params.append("serviceId", id.toString()));

      if (empresa) params.set("empresa", empresa);
      if (cliente) params.set("cliente", cliente);
      if (fechaEstimadaDesde) params.set("fechaEstimadaDesde", fechaEstimadaDesde);
      if (fechaEstimadaHasta) params.set("fechaEstimadaHasta", fechaEstimadaHasta);

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
  }, [page, search, serviceIds, empresa, cliente, fechaEstimadaDesde, fechaEstimadaHasta]);

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
    await fetch(`/api/pedidos/${id}/estatus`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estatus: status }),
    });

    fetchPedidos();
  }

  function handleServiceSelect(id: number | null) {
    setPage(1);
    setServiceIds(id === null ? [] : [id]);
  }

  async function handleDetalleStatusChange(detalleId: number, status: string) {
    await fetch(`/api/pedidos/detalles/${detalleId}/estatus`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estatus: status }),
    });

    fetchPedidos();
  }

  // Render template with data, search, filters, pagination, and user role
  return (
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
      clientes={clientes}
      empresa={empresa}
      setEmpresa={setEmpresa}
      cliente={cliente}
      setCliente={setCliente}
      fechaEstimadaDesde={fechaEstimadaDesde}
      setFechaEstimadaDesde={setFechaEstimadaDesde}
      fechaEstimadaHasta={fechaEstimadaHasta}
      setFechaEstimadaHasta={setFechaEstimadaHasta}
      services={services}
      selectedServiceId={serviceIds.length === 1 ? serviceIds[0] : null}
      onServiceSelect={handleServiceSelect}
      onDetalleStatusChange={handleDetalleStatusChange}
      title="Pedidos"
      historyButtonHref="/pedidos/finalizados"
      historyButtonLabel="Pedidos Completados / Cancelados"
      showServiceTabs={true}
    />
  );
}

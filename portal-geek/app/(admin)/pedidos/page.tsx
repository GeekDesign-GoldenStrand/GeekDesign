"use client";

import { useState, useEffect, useCallback } from "react";

import type { PedidoServiceOption } from "@/components/admin/molecules/PedidosServiceTabs";
import type { ServiceStatusSummary } from "@/components/admin/molecules/ServiceStatusSemaphore";
import { PedidosTemplate } from "@/components/admin/templates/PedidosTemplate";

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
}

// Raw API response type
interface PedidoApi {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;

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

  detalles?: PedidoDetalle[];
  serviceStatusSummary?: ServiceStatusSummary;
}

export default function PedidosPage() {
  // Local state for orders list and pagination/search controls
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter states (active flag, service IDs, statuses, company, client)
  const [onlyActive, setOnlyActive] = useState(false);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [estatuses, setEstatuses] = useState<string[]>([]);
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [cliente, setCliente] = useState<string | null>(null);

  const pageSize = 10;

  const [services, setServices] = useState<PedidoServiceOption[]>([]);

  // Fetch orders from API with filters and pagination
  const fetchPedidos = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("onlyActive", onlyActive ? "true" : "false");

      if (search) params.set("search", search);

      serviceIds.forEach((id) => params.append("serviceId", id.toString()));
      estatuses.forEach((e) => params.append("estatus", e));

      if (empresa) params.set("empresa", empresa);
      if (cliente) params.set("cliente", cliente);

      const res = await fetch(`/api/pedidos?${params.toString()}`);
      const json = await res.json();

      // Map API response into frontend-friendly structure
      const mapped: Pedido[] = (json.data ?? []).map((p: PedidoApi) => ({
        id_pedido: p.id_pedido,
        fecha_creacion: p.fecha_creacion,
        fecha_estimada: p.fecha_estimada ?? null,
        folio: p.cotizaciones?.[0]?.folio ?? null,
        // Take latest quotation amount if it exists
        monto_total: p.cotizaciones?.[0] ? Number(p.cotizaciones[0].monto_total) : null,
        cliente: p.cliente,
        estatus: p.estatus,
        estado_factura: p.estado_factura ?? null,
        detalles: p.detalles ?? [],
        serviceStatusSummary: p.serviceStatusSummary,
      }));

      setPedidos(mapped);
      setTotal(json.total ?? 0);
    } catch {
      console.error("Error loading orders");
    }
  }, [page, search, onlyActive, serviceIds, estatuses, empresa, cliente]);

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

  // Render template with data, search, filters, and pagination
  return (
    <PedidosTemplate
      pedidos={pedidos}
      search={search}
      setSearch={setSearch}
      page={page}
      setPage={setPage}
      total={total}
      onDelete={handleDelete}
      onStatusChange={handleStatusChange}
      onlyActive={onlyActive}
      setOnlyActive={setOnlyActive}
      serviceIds={serviceIds}
      setServiceIds={setServiceIds}
      estatuses={estatuses}
      setEstatuses={setEstatuses}
      empresa={empresa}
      setEmpresa={setEmpresa}
      cliente={cliente}
      setCliente={setCliente}
      services={services}
      selectedServiceId={serviceIds.length === 1 ? serviceIds[0] : null}
      onServiceSelect={handleServiceSelect}
      onDetalleStatusChange={handleDetalleStatusChange}
    />
  );
}

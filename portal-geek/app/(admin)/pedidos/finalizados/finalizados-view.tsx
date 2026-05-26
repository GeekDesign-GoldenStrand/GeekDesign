"use client";

import { useState, useEffect, useCallback } from "react";

import type { PedidoServiceOption } from "@/components/admin/molecules/PedidosServiceTabs";
import type { ServiceStatusSummary } from "@/components/admin/molecules/ServiceStatusSemaphore";
import { PedidosTemplate } from "@/components/admin/templates/PedidosTemplate";
import type { UserRole } from "@/types";

const FINAL_PEDIDO_STATUSES = ["Entregado", "Cancelado"];

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
  archivos: { id: number; nombre: string }[];
}

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

export function FinalizadosView({ role }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [estatuses, setEstatuses] = useState<string[]>(FINAL_PEDIDO_STATUSES);
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [cliente, setCliente] = useState<string | null>(null);
  const [services, setServices] = useState<PedidoServiceOption[]>([]);

  const pageSize = 10;

  const fetchPedidos = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      params.set("onlyActive", "false");

      if (search) params.set("search", search);

      serviceIds.forEach((id) => params.append("serviceId", id.toString()));

      // This view is only for completed/canceled orders.
      FINAL_PEDIDO_STATUSES.forEach((status) => params.append("estatus", status));

      if (empresa) params.set("empresa", empresa);
      if (cliente) params.set("cliente", cliente);

      const res = await fetch(`/api/pedidos?${params.toString()}`);
      const json = await res.json();

      const mapped: Pedido[] = (json.data ?? []).map((p: PedidoApi) => ({
        id_pedido: p.id_pedido,
        fecha_creacion: p.fecha_creacion,
        fecha_estimada: p.fecha_estimada ?? null,
        folio: p.cotizaciones?.[0]?.folio ?? null,
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
      console.error("Error loading finalized orders");
    }
  }, [page, search, serviceIds, empresa, cliente]);

  useEffect(() => {
    fetchPedidos();
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

  return (
    <PedidosTemplate
      role={role}
      pedidos={pedidos}
      search={search}
      setSearch={setSearch}
      page={page}
      setPage={setPage}
      total={total}
      onDelete={() => {}}
      onStatusChange={() => {}}
      onlyActive={false}
      setOnlyActive={() => {}}
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
      title="Pedidos Completados / Cancelados"
      backButtonHref="/pedidos"
      backButtonLabel="Volver a Pedidos"
      showServiceTabs={true}
    />
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";

import { PedidosTemplate } from "@/components/admin/templates/PedidosTemplate";

// Frontend type for a single order (pedido)
interface Pedido {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  cliente: {
    nombre_cliente: string;
    empresa?: string | null;
  };
  estatus: {
    descripcion: string;
  };
  factura: boolean;
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

      // Store API response in local state
      setPedidos(json.data ?? []);
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
    />
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { PedidoDetailPage } from "@/components/ui/pedidos/templates/PedidoDetailPage";
import type { UserRole } from "@/types";
import type { Pedido } from "@/types/pedido";

async function fetchPedido(id: string): Promise<Pedido> {
  const res = await fetch(`/api/pedidos/${id}`);
  if (!res.ok) throw new Error("Error al cargar el pedido");
  const json = await res.json();
  return json.data;
}

export default function PedidoDetail({ id, role }: { id: string; role: UserRole }) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const data = await fetchPedido(id);
      setPedido(data);
    } catch {
      setError("Hubo un error al recargar el pedido.");
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await fetchPedido(id);
        if (!cancelled) setPedido(data);
      } catch {
        if (!cancelled) setError("Hubo un error al cargar el pedido.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) return <p className="px-8 pt-6 text-sm text-[#8e908f]">Cargando pedido…</p>;
  if (error) return <p className="px-8 pt-6 text-sm text-[#e42200]">{error}</p>;
  if (!pedido) return null;

  const title = pedido.pedido.nombre_oportunidad
    ? `Pedido — ${pedido.pedido.nombre_oportunidad}`
    : `Pedido #${pedido.pedido.id_pedido}`;

  return (
    <div>
      <AdminHeader title={title} />
      <PedidoDetailPage pedido={pedido} role={role} onRefetch={refetch} />
    </div>
  );
}

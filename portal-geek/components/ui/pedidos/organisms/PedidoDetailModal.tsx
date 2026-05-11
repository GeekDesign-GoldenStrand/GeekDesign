"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { EstatusBadge } from "@/components/ui/pedidos/atoms/EstatusBadge";
import { TabButton } from "@/components/ui/pedidos/atoms/TabButton";
import { DetallesTab } from "@/components/ui/pedidos/molecules/DetallesTab";
import { HistorialTab } from "@/components/ui/pedidos/molecules/HistorialTab";
import { InfoTab } from "@/components/ui/pedidos/molecules/InfoTab";
import { PagosTab } from "@/components/ui/pedidos/molecules/PagosTab";
import type { PedidoDetailData } from "@/components/ui/pedidos/types";

type Tab = "info" | "detalles" | "pagos" | "historial";

interface Props {
  pedidoId: number;
  onClose: () => void;
}

export function PedidoDetailModal({ pedidoId, onClose }: Props) {
  const [data, setData] = useState<PedidoDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("info");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/pedidos/${pedidoId}`, { signal: controller.signal })
      .then(async (res) => {
        const json = (await res.json()) as { data?: PedidoDetailData; error?: string };
        if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
        setData(json.data ?? null);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [pedidoId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[12px] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[#e8e8e8] px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-ibm-plex text-[20px] font-medium text-[#1e1e1e]">
              Pedido #{pedidoId}
            </h2>
            {data && <EstatusBadge estatus={data.estatus.descripcion} />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8e908f] transition-colors hover:text-[#e42200]"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-[#e8e8e8] px-6 pt-3 pb-0">
          {(
            [
              { id: "info", label: "Información" },
              { id: "detalles", label: "Detalles" },
              { id: "pagos", label: "Pagos" },
              { id: "historial", label: "Historial" },
            ] as { id: Tab; label: string }[]
          ).map(({ id, label }) => (
            <TabButton key={id} active={tab === id} onClick={() => setTab(id)}>
              {label}
            </TabButton>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <p className="py-16 text-center font-ibm-plex text-[14px] text-[#8e908f]">
              Cargando...
            </p>
          )}
          {!loading && error && (
            <p className="py-16 text-center font-ibm-plex text-[14px] text-[#e42200]">{error}</p>
          )}
          {!loading && data && (
            <>
              {tab === "info" && <InfoTab data={data} />}
              {tab === "detalles" && <DetallesTab detalles={data.detalles} />}
              {tab === "pagos" && <PagosTab pagos={data.pagos} />}
              {tab === "historial" && <HistorialTab historial={data.historial} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

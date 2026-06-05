"use client";

import { useCallback, useState } from "react";

import EditarPedido from "@/app/(admin)/pedidos/[id]/editar-pedido";
import { MAX_PAGOS_POR_PEDIDO } from "@/lib/schemas/pagos";
import type { UserRole } from "@/types";
import type { OrdenGenerada, Pedido } from "@/types/pedido";

import { PedidoClienteCard } from "../molecules/PedidoClienteCard";
import { PedidoDetallesTable } from "../molecules/PedidoDetallesTable";
import { PedidoGeneralCard } from "../molecules/PedidoGeneralCard";
import { PedidoHistorialCard } from "../molecules/PedidoHistorialCard";
import { PedidoOCResultCard, triggerBlobDownload } from "../molecules/PedidoOCResultCard";
import { PedidoPagosCard } from "../molecules/PedidoPagosCard";
import { PedidoHeader } from "../organisms/PedidoHeader";
import { RegistrarPagoModal } from "../organisms/RegistrarPagoModal";

type ActivePanel = "edit" | null;

interface Props {
  pedido: Pedido;
  role: UserRole;
  onRefetch: () => Promise<void>;
  detalleIds?: number[] | null;
}

export function PedidoDetailPage({ pedido, role, onRefetch, detalleIds }: Props) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  // Collapse history by default when filtering to a service — keep focus on the filtered line items
  const [showHistorial, setShowHistorial] = useState(!detalleIds);
  const togglePanel = (panel: ActivePanel) =>
    setActivePanel((prev) => (prev === panel ? null : panel));

  const [ocLoading, setOcLoading] = useState(false);
  const [ocError, setOcError] = useState<string | null>(null);
  const [ordenes, setOrdenes] = useState<OrdenGenerada[]>([]);
  const [showPagoModal, setShowPagoModal] = useState(false);

  const canGenerateOC =
    (role === "Direccion" || role === "Administrador" || role === "Colaborador") &&
    pedido.hasTerceros;

  // Mirrors the API guard `withSection("finanzas", "write")` (Direccion / Finanzas;
  // Administrador is a legacy alias of Direccion).
  const canRegisterPago = role === "Direccion" || role === "Administrador" || role === "Finanzas";

  // Suggested payment amount = the order's line-item total (same sum shown in
  // PedidoDetallesTable). Pre-fills the modal so the common case is one click.
  const totalDetalle = pedido.detalle.reduce((acc, d) => acc + Number(d.subtotal), 0);

  // Amount already collected = sum of "Pagado" payments. Mirrors the server-side
  // guards in createPago so the UI and API stay in sync.
  const totalPagado = pedido.pagos
    .filter((p) => p.estatus_pago === "Pagado")
    .reduce((acc, p) => acc + Number(p.monto_pago), 0);

  const registroBloqueado =
    pedido.pagos.length >= MAX_PAGOS_POR_PEDIDO
      ? `Límite de ${MAX_PAGOS_POR_PEDIDO} pagos alcanzado.`
      : totalDetalle > 0 && totalPagado >= totalDetalle
        ? "El pedido ya está totalmente pagado."
        : null;

  const handleSave = useCallback(async () => {
    await onRefetch();
    setActivePanel(null);
  }, [onRefetch]);

  async function handleGenerarOC() {
    setOcLoading(true);
    setOcError(null);
    setOrdenes([]);
    try {
      const res = await fetch(`/api/pedidos/${pedido.pedido.id_pedido}/orden-compra-interna`, {
        method: "POST",
      });
      const contentType = res.headers.get("Content-Type") ?? "";
      if (!res.ok) {
        let apiError = "";
        try {
          const json = await res.json();
          apiError = json.error ?? "";
        } catch {
          /* non-JSON */
        }
        setOcError(
          res.status === 400
            ? apiError || "No se encontraron terceros vinculados a los servicios de este pedido"
            : res.status === 404
              ? "Pedido no encontrado"
              : apiError || "Error al generar la orden de compra"
        );
        return;
      }
      if (contentType.includes("application/pdf")) {
        const blob = new Blob([await res.arrayBuffer()], { type: "application/pdf" });
        triggerBlobDownload(blob, `OC-${pedido.pedido.id_pedido}.pdf`);
      } else if (contentType.includes("application/json")) {
        const json = await res.json();
        const generadas: OrdenGenerada[] = json.ordenes_generadas ?? [];
        if (generadas.length === 0) {
          setOcError("No se encontraron terceros vinculados a los servicios de este pedido");
        } else {
          setOrdenes(generadas);
        }
      } else {
        setOcError("Error al generar la orden de compra");
      }
    } catch {
      setOcError("Error al generar la orden de compra");
    } finally {
      setOcLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 font-sans">
      <PedidoHeader
        folio={pedido.pedido.cotizaciones?.[0]?.folio ?? null}
        nombreOportunidad={pedido.pedido.nombre_oportunidad}
        onEdit={() => togglePanel("edit")}
        canGenerateOC={canGenerateOC}
        ocLoading={ocLoading}
        onGenerarOC={handleGenerarOC}
      />

      {ocError && (
        <p
          role="alert"
          className="mb-4 text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {ocError}
        </p>
      )}

      <PedidoOCResultCard ordenes={ordenes} />

      <EditarPedido
        idPedido={pedido.pedido.id_pedido}
        pedido={pedido.pedido}
        isOpen={activePanel === "edit"}
        onSave={handleSave}
        onClose={() => setActivePanel(null)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <PedidoGeneralCard pedido={pedido.pedido} />
        <PedidoClienteCard cliente={pedido.pedido.cliente} />
      </div>

      <div className="mb-4">
        <PedidoDetallesTable detalle={pedido.detalle} detalleIds={detalleIds} />
      </div>

      <div className="mb-4">
        <PedidoPagosCard
          pagos={pedido.pagos}
          onRegister={canRegisterPago ? () => setShowPagoModal(true) : undefined}
          disabledReason={registroBloqueado}
        />
      </div>

      <RegistrarPagoModal
        idPedido={pedido.pedido.id_pedido}
        montoSugerido={totalDetalle}
        isOpen={showPagoModal}
        onClose={() => setShowPagoModal(false)}
        onSuccess={async () => {
          await onRefetch();
          setShowPagoModal(false);
        }}
      />

      <div className="mb-4">
        {detalleIds && (
          <button
            type="button"
            onClick={() => setShowHistorial((v) => !v)}
            className="mb-2 text-sm text-gray-500 underline hover:text-gray-700"
          >
            {showHistorial ? "Ocultar historial" : "Ver historial del pedido"}
          </button>
        )}
        {showHistorial && <PedidoHistorialCard historial={pedido.historial} />}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { Modal } from "@/components/ui/atoms/Modal";

type MetodoPago = "efectivo" | "transferencia";

interface Props {
  idPedido: number;
  /** Net amount currently collected on the order; the full refund defaults to this. */
  montoReembolso: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

const METODOS: MetodoPago[] = ["transferencia", "efectivo"];

const LABEL = "block text-[13px] font-medium text-[#1e1e1e] mb-1";
const FIELD =
  "w-full rounded-lg border border-[#d1d1d1] bg-white px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#e42200] focus:ring-1 focus:ring-[#e42200]";

function money(value: number) {
  return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;
}

export function SolicitarReembolsoModal({
  idPedido,
  montoReembolso,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [metodo, setMetodo] = useState<MetodoPago>("transferencia");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (submitting) return;
    setMetodo("transferencia");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pedido: idPedido,
          monto_pago: montoReembolso,
          metodo_pago: metodo,
          estatus_pago: "Reembolsado",
        }),
      });

      if (!res.ok) {
        let apiError = "";
        try {
          apiError = (await res.json())?.error ?? "";
        } catch {
          /* non-JSON body */
        }
        setError(apiError || "No se pudo solicitar el reembolso.");
        return;
      }

      await onSuccess();
      setMetodo("transferencia");
      onClose();
    } catch {
      setError("No se pudo solicitar el reembolso.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Solicitar reembolso"
      size="md"
      dismissable={!submitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-[14px] text-gray-600">
          Se registrará un reembolso de{" "}
          <span className="font-semibold text-[#1e1e1e]">{money(montoReembolso)}</span> para este
          pedido. El monto se restará de los ingresos en las métricas.
        </p>

        <div>
          <label htmlFor="reembolso-metodo" className={LABEL}>
            Método de reembolso
          </label>
          <select
            id="reembolso-metodo"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value as MetodoPago)}
            className={FIELD}
          >
            {METODOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p
            role="alert"
            className="text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            section="admin"
            size="md"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="destructive"
            section="admin"
            size="md"
            loading={submitting}
          >
            Confirmar reembolso
          </Button>
        </div>
      </form>
    </Modal>
  );
}

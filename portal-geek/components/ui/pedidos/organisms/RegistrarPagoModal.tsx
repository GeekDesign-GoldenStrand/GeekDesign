"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { Modal } from "@/components/ui/atoms/Modal";

type MetodoPago = "efectivo" | "transferencia" | "Mercado Pago";
type EstatusPago = "Pendiente" | "Pagado" | "Reembolsado";

interface Props {
  idPedido: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  /** Pre-fills the amount field when the modal opens (e.g. the order total). */
  montoSugerido?: number;
}

const METODOS: MetodoPago[] = ["efectivo", "transferencia", "Mercado Pago"];
const ESTATUS: EstatusPago[] = ["Pagado", "Pendiente", "Reembolsado"];

// Cap the integer part at 7 digits (the decimal point doesn't count), well within
// the monto_pago Decimal(10,2) column.
const MAX_MONTO_DIGITOS = 7;

const LABEL = "block text-[13px] font-medium text-[#1e1e1e] mb-1";
const FIELD =
  "w-full rounded-lg border border-[#d1d1d1] bg-white px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#e42200] focus:ring-1 focus:ring-[#e42200]";

// Render a numeric amount as an editable string: drop the decimals when it's a
// whole number, otherwise keep two places.
function formatMonto(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function RegistrarPagoModal({ idPedido, isOpen, onClose, onSuccess, montoSugerido }: Props) {
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  // Default to "Pagado" — registering a payment usually means it was collected,
  // and only "Pagado" payments count toward revenue metrics.
  const [estatus, setEstatus] = useState<EstatusPago>("Pagado");
  const [referencia, setReferencia] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMonto("");
    setMetodo("efectivo");
    setEstatus("Pagado");
    setReferencia("");
    setError(null);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  // Pre-fill the amount with the suggested total each time the modal opens. The
  // field stays fully editable — this is just a sensible default.
  useEffect(() => {
    if (!isOpen) return;
    setMonto(montoSugerido && montoSugerido > 0 ? formatMonto(montoSugerido) : "");
  }, [isOpen, montoSugerido]);

  // Mirror the system-wide numeric-input guard: digits with at most one decimal
  // point and two decimals, capped at MAX_MONTO_DIGITOS digits (the dot doesn't
  // count). Rejects letters, signs, scientific notation and pasted junk that a
  // type="number" field would otherwise let through.
  function handleMontoChange(raw: string) {
    const digitCount = raw.replace(/\./g, "").length;
    if (raw === "" || (/^\d*\.?\d{0,2}$/.test(raw) && digitCount <= MAX_MONTO_DIGITOS)) {
      setMonto(raw);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      setError("Ingresa un monto válido mayor a 0.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pedido: idPedido,
          monto_pago: montoNum,
          metodo_pago: metodo,
          estatus_pago: estatus,
          ...(metodo === "Mercado Pago" && referencia.trim()
            ? { referencia_mercadopago: referencia.trim() }
            : {}),
        }),
      });

      if (!res.ok) {
        let apiError = "";
        try {
          apiError = (await res.json())?.error ?? "";
        } catch {
          /* non-JSON body */
        }
        setError(apiError || "No se pudo registrar el pago.");
        return;
      }

      await onSuccess();
      reset();
      onClose();
    } catch {
      setError("No se pudo registrar el pago.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar pago"
      size="md"
      dismissable={!submitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pago-monto" className={LABEL}>
            Monto (MXN){" "}
          </label>
          <input
            id="pago-monto"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={monto}
            onChange={(e) => handleMontoChange(e.target.value)}
            placeholder="0.00"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="pago-metodo" className={LABEL}>
            Método de pago
          </label>
          <select
            id="pago-metodo"
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

        <div>
          <label htmlFor="pago-estatus" className={LABEL}>
            Estatus
          </label>
          <select
            id="pago-estatus"
            value={estatus}
            onChange={(e) => setEstatus(e.target.value as EstatusPago)}
            className={FIELD}
          >
            {ESTATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {metodo === "Mercado Pago" && (
          <div>
            <label htmlFor="pago-referencia" className={LABEL}>
              Referencia Mercado Pago <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="pago-referencia"
              type="text"
              autoComplete="off"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              maxLength={255}
              className={FIELD}
            />
          </div>
        )}

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
          <Button type="submit" variant="primary" section="admin" size="md" loading={submitting}>
            Registrar pago
          </Button>
        </div>
      </form>
    </Modal>
  );
}

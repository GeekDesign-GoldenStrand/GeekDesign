import React, { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/atoms";
import { Button } from "@/components/ui/atoms/Button";
import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
// Discount rules + validator come from the schema module so this modal
// and the Zod-validated PATCH endpoint can't drift. See
// lib/schemas/cotizaciones.ts for the single source of truth.
import {
  DISCOUNT_MAX,
  DISCOUNT_MIN,
  DISCOUNT_STEP,
  validateDescuentoPercentage,
} from "@/lib/schemas/cotizaciones";

function fmt(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

interface AplicarDescuentoProps {
  idCotizacion: number;
  baseAmount: number;
  isOpen: boolean;
  initialPercentage?: number;
  initialMotivo?: string;
  onApplied: () => void;
  onClose: () => void;
}

export default function AplicarDescuento({
  idCotizacion,
  baseAmount,
  isOpen,
  initialPercentage,
  initialMotivo,
  onApplied,
  onClose,
}: AplicarDescuentoProps) {
  const [percentage, setPercentage] = useState<number>(initialPercentage ?? DISCOUNT_MIN);
  const [motivo, setMotivo] = useState<string>(initialMotivo ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const hasExistingDiscount = (initialPercentage ?? 0) > 0;

  useEffect(() => {
    if (!isOpen) return;
    setPercentage(initialPercentage ?? DISCOUNT_MIN);
    setMotivo(initialMotivo ?? "");
    setServerError(null);
    setIsDeleting(false);
  }, [isOpen, initialPercentage, initialMotivo]);

  useEffect(() => {
    setServerError(null);
  }, [percentage, motivo]);

  if (!isOpen) return null;

  const validationError = validateDescuentoPercentage(percentage);
  const isPercentageValid = validationError === null;
  const displayedError = serverError ?? (!hasExistingDiscount ? validationError : null);

  const previewPct = Number.isFinite(percentage)
    ? Math.min(Math.max(0, percentage), DISCOUNT_MAX)
    : 0;
  const computed = baseAmount * (previewPct / 100);
  const afterDiscount = baseAmount - computed;

  // ── Delete ────────────────────────────────
  async function handleDelete() {
    setServerError(null);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cotizaciones/${idCotizacion}/descuento`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          porcentaje_descuento: null,
          motivo_descuento: null,
        }),
      });

      let payload: { data?: unknown; error?: string } = {};
      try {
        payload = await res.json();
      } catch {
        /* non-JSON */
      }

      if (!res.ok) {
        const fallback =
          res.status === 404
            ? "Cotización no encontrada"
            : res.status === 409
              ? "No se puede modificar esta cotización en su estatus actual"
              : "No se pudo eliminar el descuento";
        setServerError(payload.error ?? fallback);
        return;
      }

      onApplied();
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error de red al eliminar el descuento");
    } finally {
      setIsDeleting(false);
    }
  }

  // ── Apply ─────────────────────────────────
  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (validationError) return;

    setServerError(null);
    setIsSubmitting(true);
    try {
      const trimmedMotivo = motivo.trim();
      const res = await fetch(`/api/cotizaciones/${idCotizacion}/descuento`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          porcentaje_descuento: percentage,
          ...(trimmedMotivo ? { motivo_descuento: trimmedMotivo } : {}),
        }),
      });

      let payload: { data?: unknown; error?: string } = {};
      try {
        payload = await res.json();
      } catch {
        /* non-JSON */
      }

      if (!res.ok) {
        const fallback =
          res.status === 404
            ? "Cotización no encontrada"
            : res.status === 409
              ? "No se puede modificar esta cotización en su estatus actual"
              : "No se pudo aplicar el descuento";
        setServerError(payload.error ?? fallback);
        return;
      }

      onApplied();
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error de red al aplicar el descuento");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Delete-confirmation modal (when a discount already exists) ────
  if (hasExistingDiscount) {
    const existingComputed = baseAmount * ((initialPercentage ?? 0) / 100);

    return (
      <ConfirmDialog
        isOpen
        title="Eliminar descuento"
        confirmLabel="Sí, eliminar"
        loadingLabel="Eliminando…"
        loading={isDeleting}
        error={serverError}
        onClose={onClose}
        onConfirm={handleDelete}
        description={
          <>
            <p className="mb-2 text-[14px] text-gray-700">
              ¿Estás seguro de que deseas eliminar el descuento de{" "}
              <span className="font-semibold">{initialPercentage}%</span>?
            </p>
            {initialMotivo && (
              <p className="mb-2 text-[13px] text-gray-500">
                Motivo: <span className="font-medium text-gray-700">{initialMotivo}</span>
              </p>
            )}
            <p className="text-[13px] text-gray-400">
              El monto total volverá a{" "}
              <span className="font-medium text-gray-700">{fmt(baseAmount)}</span> (se revertirá el
              ahorro de {fmt(existingComputed)}).
            </p>
          </>
        }
      />
    );
  }

  // ── Apply form when no discount exists ────
  return (
    <ModalShell title="Agregar descuento" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex flex-col text-[13px] text-[#575757]">
            <label className="font-medium mb-1">
              Porcentaje de descuento (%) <span className="text-[#A32D2D]">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="^[0-9]+$"
              min={DISCOUNT_MIN}
              max={DISCOUNT_MAX}
              value={Number.isFinite(percentage) ? percentage : ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setPercentage(Number.NaN);
                  return;
                }
                if (!/^\d+$/.test(raw)) return;
                const parsed = parseInt(raw, 10);
                if (Number.isNaN(parsed)) {
                  setPercentage(Number.NaN);
                  return;
                }
                const clamped = Math.min(Math.max(parsed, DISCOUNT_MIN), DISCOUNT_MAX);
                setPercentage(clamped);
              }}
              aria-invalid={!isPercentageValid}
              className={`w-32 text-[22px] font-medium border rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 ${
                isPercentageValid
                  ? "border-gray-200 focus:ring-blue-100"
                  : "border-red-300 focus:ring-red-100"
              }`}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Múltiplos de {DISCOUNT_STEP}% (mínimo {DISCOUNT_MIN}%, máximo {DISCOUNT_MAX}%)
            </p>
          </div>

          <div className="flex flex-col text-[13px] text-[#575757] flex-1 min-w-[220px]">
            <label className="font-medium mb-1">Motivo del descuento (opcional)</label>
            <input
              type="text"
              value={motivo}
              maxLength={255}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Cliente frecuente"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="bg-[#FCEBEB] rounded-lg px-4 py-3 flex justify-between items-center mb-2">
          <div>
            <p className="text-[13px] text-[#791F1F] font-medium">Descuento aplicado</p>
            <p className="text-[12px] text-[#A32D2D] mt-0.5">
              {previewPct}% sobre {fmt(baseAmount)}
            </p>
          </div>
          <p className="text-[18px] font-medium text-[#A32D2D]">− {fmt(computed)}</p>
        </div>

        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg">
          <p className="text-[13px] text-gray-400">Total con descuento</p>
          <p className="text-[18px] font-medium text-[#3B6D11]">{fmt(afterDiscount)}</p>
        </div>

        {displayedError && (
          <p
            role="alert"
            className="mt-3 text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          >
            {displayedError}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || !isPercentageValid}
            loading={isSubmitting}
          >
            {isSubmitting ? "Aplicando…" : "Aplicar descuento"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

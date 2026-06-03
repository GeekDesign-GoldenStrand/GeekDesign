import { CaretDown, CaretUp } from "@phosphor-icons/react";
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
  // Default to +5 (a sensible small discount) when no existing adjustment
  // — avoids the modal opening at the lower bound (−20% interés) which
  // would surprise users opening the modal to apply a discount.
  const DEFAULT_PCT = 5;
  // String state lets the user type a lone "-" mid-keystroke (becomes "-5")
  // without it disappearing — a number-state input would render NaN as
  // empty and swallow the sign before the digit arrives.
  const [percentageText, setPercentageText] = useState<string>(
    String(initialPercentage ?? DEFAULT_PCT)
  );
  const [motivo, setMotivo] = useState<string>(initialMotivo ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Derived numeric value — NaN when the field is empty, "-" alone, or "-0".
  const percentage = (() => {
    if (percentageText === "" || percentageText === "-") return Number.NaN;
    const parsed = parseInt(percentageText, 10);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  })();

  // An adjustment exists when porcentaje is set AND non-zero — covers both
  // discounts (positive) and surcharges/interest (negative).
  const hasExistingDiscount = initialPercentage != null && initialPercentage !== 0;

  useEffect(() => {
    if (!isOpen) return;
    setPercentageText(String(initialPercentage ?? DEFAULT_PCT));
    setMotivo(initialMotivo ?? "");
    setServerError(null);
    setIsDeleting(false);
  }, [isOpen, initialPercentage, initialMotivo]);

  useEffect(() => {
    setServerError(null);
  }, [percentageText, motivo]);

  // Step ±1, skip 0 (which is rejected by the validator), clamp to range.
  function bumpPercentage(delta: number) {
    const current = Number.isFinite(percentage) ? percentage : 0;
    let next = current + delta;
    if (next === 0) next = delta > 0 ? 1 : -1;
    next = Math.max(DISCOUNT_MIN, Math.min(DISCOUNT_MAX, next));
    setPercentageText(String(next));
  }

  if (!isOpen) return null;

  const validationError = validateDescuentoPercentage(percentage);
  const isPercentageValid = validationError === null;
  const displayedError = serverError ?? (!hasExistingDiscount ? validationError : null);

  // Clamp preview to the full signed range so negatives flow through.
  const previewPct = Number.isFinite(percentage)
    ? Math.min(Math.max(DISCOUNT_MIN, percentage), DISCOUNT_MAX)
    : 0;
  // Positive pct → reduces total (savings shown). Negative pct → raises
  // total (interest shown). adjustmentAmount is always the absolute MXN
  // delta; isCharge controls the labels and sign in the UI.
  const isCharge = previewPct < 0;
  const adjustmentAmount = Math.abs(baseAmount * (previewPct / 100));
  const afterDiscount = baseAmount - baseAmount * (previewPct / 100);

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

  // ── Delete-confirmation modal (when an adjustment already exists) ──
  if (hasExistingDiscount) {
    const existingPct = initialPercentage ?? 0;
    const existingIsCharge = existingPct < 0;
    const existingLabel = existingIsCharge ? "interés" : "descuento";
    const existingDelta = Math.abs(baseAmount * (existingPct / 100));

    return (
      <ConfirmDialog
        isOpen
        title={`Eliminar ${existingLabel}`}
        confirmLabel="Sí, eliminar"
        loadingLabel="Eliminando…"
        loading={isDeleting}
        error={serverError}
        onClose={onClose}
        onConfirm={handleDelete}
        description={
          <>
            <p className="mb-2 text-[14px] text-gray-700">
              ¿Estás seguro de que deseas eliminar el {existingLabel} de{" "}
              <span className="font-semibold">{Math.abs(existingPct)}%</span>?
            </p>
            {initialMotivo && (
              <p className="mb-2 text-[13px] text-gray-500">
                Motivo: <span className="font-medium text-gray-700">{initialMotivo}</span>
              </p>
            )}
            <p className="text-[13px] text-gray-400">
              El monto total volverá a{" "}
              <span className="font-medium text-gray-700">{fmt(baseAmount)}</span> (se revertirá{" "}
              {existingIsCharge ? "el cargo" : "el ahorro"} de {fmt(existingDelta)}).
            </p>
          </>
        }
      />
    );
  }

  // ── Apply form when no discount exists ────
  return (
    <ModalShell title={isCharge ? "Agregar interés" : "Agregar descuento"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex flex-col text-[13px] text-[#575757]">
            <label className="font-medium mb-1">
              Ajuste (%) <span className="text-[#A32D2D]">*</span>
            </label>
            <div
              className={`relative w-32 border rounded-lg bg-white focus-within:outline-none focus-within:ring-2 ${
                isPercentageValid
                  ? "border-gray-200 focus-within:ring-blue-100"
                  : "border-red-300 focus-within:ring-red-100"
              }`}
            >
              <input
                type="text"
                inputMode="numeric"
                pattern="^-?[0-9]+$"
                min={DISCOUNT_MIN}
                max={DISCOUNT_MAX}
                value={percentageText}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Accept "" and "-" verbatim so the sign survives mid-typing.
                  if (raw === "" || raw === "-") {
                    setPercentageText(raw);
                    return;
                  }
                  if (!/^-?\d+$/.test(raw)) return;
                  const parsed = parseInt(raw, 10);
                  if (!Number.isFinite(parsed)) return;
                  const clamped = Math.min(Math.max(parsed, DISCOUNT_MIN), DISCOUNT_MAX);
                  setPercentageText(String(clamped));
                }}
                aria-invalid={!isPercentageValid}
                className="w-full text-[22px] font-medium pl-3 pr-7 py-2 text-gray-900 bg-transparent focus:outline-none rounded-lg"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                <button
                  type="button"
                  onClick={() => bumpPercentage(1)}
                  aria-label="Incrementar 1%"
                  className="h-4 w-5 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-sm transition-colors"
                >
                  <CaretUp size={10} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => bumpPercentage(-1)}
                  aria-label="Decrementar 1%"
                  className="h-4 w-5 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-sm transition-colors"
                >
                  <CaretDown size={10} weight="bold" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Rango {DISCOUNT_MIN}% a {DISCOUNT_MAX}%. Positivo = descuento, negativo = interés
              (pagos en plazos).
            </p>
          </div>

          <div className="flex flex-col text-[13px] text-[#575757] flex-1 min-w-[220px]">
            <label className="font-medium mb-1">
              Motivo {isCharge ? "del interés" : "del descuento"} (opcional)
            </label>
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

        <div
          className={`rounded-lg px-4 py-3 flex justify-between items-center mb-2 ${
            isCharge ? "bg-amber-50" : "bg-[#FCEBEB]"
          }`}
        >
          <div>
            <p
              className={`text-[13px] font-medium ${isCharge ? "text-amber-800" : "text-[#791F1F]"}`}
            >
              {isCharge ? "Interés aplicado" : "Descuento aplicado"}
            </p>
            <p className={`text-[12px] mt-0.5 ${isCharge ? "text-amber-700" : "text-[#A32D2D]"}`}>
              {Math.abs(previewPct)}% sobre {fmt(baseAmount)}
            </p>
          </div>
          <p
            className={`text-[18px] font-medium ${isCharge ? "text-amber-700" : "text-[#A32D2D]"}`}
          >
            {isCharge ? "+" : "−"} {fmt(adjustmentAmount)}
          </p>
        </div>

        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg">
          <p className="text-[13px] text-gray-400">
            {isCharge ? "Total con interés" : "Total con descuento"}
          </p>
          <p
            className={`text-[18px] font-medium ${isCharge ? "text-amber-700" : "text-[#3B6D11]"}`}
          >
            {fmt(afterDiscount)}
          </p>
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
            {isSubmitting ? "Aplicando…" : isCharge ? "Aplicar interés" : "Aplicar descuento"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

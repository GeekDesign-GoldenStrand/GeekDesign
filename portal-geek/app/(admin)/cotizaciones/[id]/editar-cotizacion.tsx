import { CaretDown, CaretUp } from "@phosphor-icons/react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import {
  DISCOUNT_MAX,
  DISCOUNT_MIN,
  validateDescuentoPercentage,
} from "@/lib/schemas/cotizaciones";
import { sanitizeUserText } from "@/lib/utils/safe-text";
import type { UserRole } from "@/types";
import type { LineItem } from "@/types/cotizacion";

const DISCOUNT_MOTIVO_MAX_LEN = 80;

interface ClienteOption {
  id_cliente: number;
  nombre_cliente: string;
  empresa: string | null;
}

export interface EditableFields {
  id_cliente: number;
  nombre_oportunidad: string;
  fecha_fin: string;
  notas: string;
  servicios: LineItem[];
}

function formatAmount(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

// Returns today's date as YYYY-MM-DD in local time — used as the `min`
// attribute on the date input so the browser's picker blocks past dates,
// and also for the validation error message.
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fieldsAreEqual(a: EditableFields, b: EditableFields): boolean {
  if (
    a.id_cliente !== b.id_cliente ||
    a.nombre_oportunidad !== b.nombre_oportunidad ||
    a.fecha_fin !== b.fecha_fin ||
    a.notas !== b.notas ||
    a.servicios.length !== b.servicios.length
  ) {
    return false;
  }
  return a.servicios.every((s, i) => {
    const t = b.servicios[i];
    return (
      s.id_detalle === t.id_detalle &&
      s.cantidad === t.cantidad &&
      s.precio_unitario === t.precio_unitario
    );
  });
}

function discountFieldsAreEqual(
  currentPercentage: number,
  currentMotivo: string,
  initialPercentage?: number | null,
  initialMotivo?: string | null
): boolean {
  return (
    currentPercentage === (initialPercentage ?? 0) &&
    currentMotivo.trim() === (initialMotivo ?? "").trim()
  );
}

interface EditarCotizacionProps {
  idCotizacion: number;
  isOpen: boolean;
  initial: EditableFields;
  currentCliente?: ClienteOption;
  porcentajeDescuento?: number | null;
  motivoDescuento?: string | null;
  userRole?: UserRole;
  onSave: (data: EditableFields) => void;
  onClose: () => void;
  // Called when a discount/interest is successfully applied via this modal
  onDiscountApplied?: () => void;
  onSuccess?: () => void;
}

export default function EditarCotizacion({
  idCotizacion,
  isOpen,
  initial,
  currentCliente,
  porcentajeDescuento,
  motivoDescuento,
  userRole,
  onSave,
  onClose,
  onDiscountApplied,
  onSuccess,
}: EditarCotizacionProps) {
  const [fields, setFields] = useState<EditableFields>({
    ...initial,
    servicios: initial.servicios.map((p) => ({ ...p })),
  });

  const initialDiscountPercentage = porcentajeDescuento ?? 0;

  // Mirror the server-side gate on PATCH /api/cotizaciones/[id]/descuento,
  // which requires Direccion. Without this check, non-Direccion users would
  // still see the discount inputs on a quotation that already has one and
  // hit a 403 only on save. The totals breakdown below still shows the
  // existing discount as read-only.
  const canEditDiscount = userRole === "Direccion";
  const showDiscountSection = canEditDiscount;

  // String source of truth for the input — preserves lone "-" mid-typing.
  // Numeric `discountPercentage` is derived below.
  const [discountPercentageText, setDiscountPercentageText] = useState<string>(
    String(initialDiscountPercentage)
  );
  const discountPercentage = (() => {
    if (discountPercentageText === "" || discountPercentageText === "-") return Number.NaN;
    const parsed = parseInt(discountPercentageText, 10);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  })();
  const [discountMotivo, setDiscountMotivo] = useState<string>(motivoDescuento ?? "");
  const [discountSnapshot, setDiscountSnapshot] = useState<{
    percentage: number;
    motivo: string;
  }>({
    percentage: initialDiscountPercentage,
    motivo: motivoDescuento ?? "",
  });

  const [clientes, setClientes] = useState<ClienteOption[]>(currentCliente ? [currentCliente] : []);
  const [clientesError, setClientesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  // Success modal handling moved to parent

  // Step ±1, skip 0 (validator rejects it), clamp to range.
  const bumpDiscount = (delta: number) => {
    setValidationError(null);
    const current = Number.isFinite(discountPercentage) ? discountPercentage : 0;
    let next = current + delta;
    if (next === 0) next = delta > 0 ? 1 : -1;
    next = Math.max(DISCOUNT_MIN, Math.min(DISCOUNT_MAX, next));
    setDiscountPercentageText(String(next));
  };

  // Snapshot of initial at the time the modal opened — used to detect
  // whether anything actually changed before firing the PATCH.
  const [snapshot, setSnapshot] = useState<EditableFields>(initial);

  // Reset fields every time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fresh = {
      ...initial,
      servicios: initial.servicios.map((p) => ({ ...p })),
    };
    setFields(fresh);
    setSnapshot(fresh);

    const freshDiscountPercentage = porcentajeDescuento ?? 0;
    const freshDiscountMotivo = motivoDescuento ?? "";

    setDiscountPercentageText(String(freshDiscountPercentage));
    setDiscountMotivo(freshDiscountMotivo);
    setDiscountSnapshot({
      percentage: freshDiscountPercentage,
      motivo: freshDiscountMotivo,
    });

    setClientesError(null);
    setServerError(null);
    setValidationError(null);
  }, [isOpen, initial, porcentajeDescuento, motivoDescuento]);

  // Fetch clientes when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/clientes?page=1&pageSize=100");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: { data: ClienteOption[] } = await res.json();
        if (cancelled) return;
        const fetched = json.data ?? [];
        const hasCurrent =
          !currentCliente || fetched.some((c) => c.id_cliente === currentCliente.id_cliente);
        setClientes(hasCurrent ? fetched : [currentCliente, ...fetched]);
      } catch (err) {
        if (cancelled) return;
        setClientesError(err instanceof Error ? err.message : "Error cargando clientes");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentCliente]);

  if (!isOpen) return null;

  const today = todayISO();

  const setField = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) => {
    setValidationError(null);
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const updateServicio = (idx: number, key: "cantidad" | "precio_unitario", value: number) => {
    setValidationError(null);
    setFields((prev) => {
      const servicios = prev.servicios.map((p, i) => {
        if (i !== idx) return p;
        const updated = { ...p, [key]: value };
        updated.subtotal = updated.cantidad * updated.precio_unitario;
        return updated;
      });
      return { ...prev, servicios };
    });
  };

  const newSubtotal = fields.servicios.reduce((acc, p) => acc + p.subtotal, 0);
  const discountPct = Number.isFinite(discountPercentage) ? discountPercentage : 0;
  // Positive pct = discount (subtracts), negative = surcharge/interest (adds).
  const hasDiscount = discountPct !== 0;
  const discountAmount = hasDiscount ? Math.round(newSubtotal * discountPct) / 100 : 0;
  const newTotal = newSubtotal - discountAmount;
  const discountChanged = !discountFieldsAreEqual(
    discountPercentage,
    discountMotivo,
    discountSnapshot.percentage,
    discountSnapshot.motivo
  );

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setValidationError(null);

    // ── Client-side validations ───────────────────────────────────────────
    if (fields.fecha_fin && fields.fecha_fin < today) {
      setValidationError("La fecha de entrega no puede ser en el pasado.");
      return;
    }

    const quotationChanged = !fieldsAreEqual(fields, snapshot);

    if (!quotationChanged && !discountChanged) {
      setValidationError("No has realizado ningún cambio.");
      return;
    }

    if (discountChanged) {
      const discountError = validateDescuentoPercentage(discountPercentage);
      if (discountError) {
        setValidationError(discountError);
        return;
      }
    }

    setIsSubmitting(true);
    // Tracks whether the PUT already committed, so that if the PATCH
    // discount call later fails we can tell the user the quotation
    // changes *did* persist — instead of showing a blanket "no se pudo
    // guardar" error that implies a full rollback. There is no atomic
    // endpoint that covers both updates, so the next best thing is to
    // be explicit about the partial-save state and let the user retry
    // the discount alone.
    let quotationSaved = false;
    try {
      if (quotationChanged) {
        const res = await fetch(`/api/cotizaciones/${idCotizacion}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_cliente: fields.id_cliente,
            nombre_oportunidad: fields.nombre_oportunidad || undefined,
            fecha_fin: fields.fecha_fin || undefined,
            notas: fields.notas || undefined,
            servicios: fields.servicios.map((s) => ({
              id_detalle: s.id_detalle,
              cantidad: s.cantidad,
              precio_unitario: s.precio_unitario,
            })),
          }),
        });

        let payload: { data?: unknown; error?: string } = {};
        try {
          payload = await res.json();
        } catch {
          /* non-JSON body */
        }

        if (!res.ok) {
          const fallback =
            res.status === 404
              ? "Cotización no encontrada"
              : res.status === 409
                ? "No se puede modificar esta cotización en su estatus actual"
                : "No se pudo guardar los cambios";
          setServerError(payload.error ?? fallback);
          return;
        }
        quotationSaved = true;
      }

      if (discountChanged) {
        const trimmedMotivo = discountMotivo.trim();

        const res = await fetch(`/api/cotizaciones/${idCotizacion}/descuento`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            porcentaje_descuento: discountPercentage,
            ...(trimmedMotivo ? { motivo_descuento: trimmedMotivo } : {}),
          }),
        });

        let payload: { data?: unknown; error?: string } = {};
        try {
          payload = await res.json();
        } catch {
          /* non-JSON body */
        }

        if (!res.ok) {
          const fallback =
            res.status === 404
              ? "Cotización no encontrada"
              : res.status === 409
                ? "No se puede modificar el descuento en su estatus actual"
                : "No se pudo actualizar el descuento";
          const baseError = payload.error ?? fallback;
          if (quotationSaved) {
            setServerError(
              `Los cambios de la cotización sí se guardaron, pero el descuento no se pudo actualizar: ${baseError}. Vuelve a intentar solo el descuento.`
            );
            // Reflect the persisted quotation edit in the parent so the
            // user sees the half that did save, and reset the snapshot
            // so a retry submit sends only the discount.
            onSave(fields);
            setSnapshot(fields);
          } else {
            setServerError(baseError);
          }
          return;
        }

        // Discount successfully applied – notify parent if needed
        if (onDiscountApplied) {
          onDiscountApplied();
        }
      }

      onClose();
      // Notify parent to show success modal after edit modal closes
      if (onSuccess) onSuccess();
    } catch (err) {
      const baseError = err instanceof Error ? err.message : "Error de red al guardar los cambios";
      if (quotationSaved) {
        setServerError(
          `Los cambios de la cotización sí se guardaron, pero el descuento no se pudo actualizar: ${baseError}. Vuelve a intentar solo el descuento.`
        );
        onSave(fields);
        setSnapshot(fields);
      } else {
        setServerError(baseError);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayedError = validationError ?? serverError;

  return (
    <>
      <ModalShell title="Editar cotización" onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="flex flex-col gap-1 col-span-2 text-[13px] text-[#575757]">
              <span className="font-medium">Nombre de oportunidad</span>
              <input
                type="text"
                value={fields.nombre_oportunidad}
                onChange={(e) => setField("nombre_oportunidad", e.target.value)}
                placeholder="Ej. Letrero exterior sucursal Reforma"
                className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="flex flex-col gap-1 col-span-2 text-[13px] text-[#575757]">
              <span className="font-medium">Cliente</span>
              <Select
                value={String(fields.id_cliente)}
                onChange={(v) => setField("id_cliente", Number(v))}
                size="sm"
              >
                {clientes.map((c) => (
                  <SelectOption key={c.id_cliente} value={String(c.id_cliente)}>
                    {c.nombre_cliente}
                    {c.empresa ? ` — ${c.empresa}` : ""}
                  </SelectOption>
                ))}
              </Select>
              {clientesError && (
                <span className="text-[11px] text-red-600 mt-0.5">
                  No se pudo cargar la lista completa de clientes ({clientesError}).
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1 col-span-2 text-[13px] text-[#575757]">
              <span className="font-medium">Fecha fin (validez)</span>
              <input
                type="date"
                min={today}
                value={fields.fecha_fin}
                onChange={(e) => setField("fecha_fin", e.target.value)}
                className={`border rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 ${
                  fields.fecha_fin && fields.fecha_fin < today
                    ? "border-red-300 focus:ring-red-100"
                    : "border-gray-200 focus:ring-blue-100"
                }`}
              />
              {fields.fecha_fin && fields.fecha_fin < today && (
                <span className="text-[11px] text-red-600 mt-0.5">
                  La fecha de entrega no puede ser en el pasado.
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1 col-span-2 text-[13px] text-[#575757]">
              <span className="font-medium">Notas</span>
              <textarea
                rows={3}
                value={fields.notas}
                onChange={(e) => setField("notas", e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white resize-y focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {showDiscountSection && (
            <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/50 p-3">
              <p className="text-[11px] font-medium text-amber-700 uppercase tracking-widest mb-3">
                {Number(discountPercentageText) < 0 ? "Interés" : "Descuento"}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-[13px] text-[#575757]">
                  <span className="font-medium">Porcentaje</span>
                  <div className="relative w-full border border-gray-200 rounded-lg bg-white focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-100">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="^-?[0-9]+$"
                      min={DISCOUNT_MIN}
                      max={DISCOUNT_MAX}
                      value={discountPercentageText}
                      onChange={(e) => {
                        setValidationError(null);
                        const raw = e.target.value;
                        // Accept "" and "-" verbatim so the sign survives mid-typing.
                        if (raw === "" || raw === "-") {
                          setDiscountPercentageText(raw);
                          return;
                        }
                        if (!/^-?\d+$/.test(raw)) return;
                        const parsed = parseInt(raw, 10);
                        if (!Number.isFinite(parsed)) return;
                        setDiscountPercentageText(
                          String(Math.min(Math.max(parsed, DISCOUNT_MIN), DISCOUNT_MAX))
                        );
                      }}
                      className="w-full pl-3 pr-7 py-2 text-[13px] text-gray-800 bg-transparent focus:outline-none rounded-lg"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                      <button
                        type="button"
                        onClick={() => bumpDiscount(1)}
                        aria-label="Incrementar 1%"
                        className="h-3.5 w-5 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-sm transition-colors"
                      >
                        <CaretUp size={9} weight="bold" />
                      </button>
                      <button
                        type="button"
                        onClick={() => bumpDiscount(-1)}
                        aria-label="Decrementar 1%"
                        className="h-3.5 w-5 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-sm transition-colors"
                      >
                        <CaretDown size={9} weight="bold" />
                      </button>
                    </div>
                  </div>
                </label>

                <label className="flex flex-col gap-1 text-[13px] text-[#575757]">
                  <span className="font-medium">Motivo</span>
                  <input
                    type="text"
                    maxLength={DISCOUNT_MOTIVO_MAX_LEN}
                    value={discountMotivo}
                    onChange={(e) => {
                      setValidationError(null);
                      setDiscountMotivo(sanitizeUserText(e.target.value));
                    }}
                    placeholder="Ej. Cliente frecuente"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Editable line items */}
          <div className="mb-4">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">
              Servicio(s)
            </p>
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr>
                  {["Servicio", "Cantidad", "P. Unitario", "Subtotal"].map((h) => (
                    <th
                      key={h}
                      className="text-[11px] font-medium text-gray-400 uppercase tracking-wider pb-2 text-left border-b border-gray-100 px-2 last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.servicios.map((item, idx) => (
                  <tr key={item.id_detalle} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-2">
                      <p className="font-medium text-gray-900">{item.nombre_servicio}</p>
                      <p className="text-[12px] text-gray-400">{item.nombre_material}</p>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="^[0-9]+$"
                        min={1}
                        max={1000}
                        value={item.cantidad}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") return;
                          if (!/^\d+$/.test(raw)) return;
                          const parsed = parseInt(raw, 10);
                          // Clamp to [1, 1000] to match the storefront cap
                          // (CarritoView + SolicitarItemSchema both use 1000).
                          const safe = Number.isFinite(parsed)
                            ? Math.max(1, Math.min(1000, parsed))
                            : 1;
                          updateServicio(idx, "cantidad", safe);
                        }}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="^[0-9]*\.?[0-9]+$"
                        min={0}
                        max={99999.99}
                        value={item.precio_unitario}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") return;
                          if (!/^\d*\.?\d*$/.test(raw)) return;
                          const parsed = parseFloat(raw);
                          // Clamp to [0, 99,999.99]. The DB stores precio_unitario,
                          // subtotal, and monto_total as Decimal(10,2) (max
                          // 99,999,999.99). With cantidad capped at 1000,
                          // 99,999.99 keeps subtotal safely inside the column.
                          const safe = Number.isFinite(parsed)
                            ? Math.max(0, Math.min(99999.99, parsed))
                            : 0;
                          updateServicio(idx, "precio_unitario", safe);
                        }}
                        className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-gray-900">
                      {formatAmount(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex flex-col items-end gap-1 text-[13px] text-gray-500">
              {hasDiscount ? (
                <>
                  <div className="flex gap-6">
                    <span>Subtotal</span>
                    <span className="min-w-[110px] text-right text-gray-800">
                      {formatAmount(newSubtotal)}
                    </span>
                  </div>
                  <div className="flex gap-6">
                    <span title={discountMotivo.trim() || undefined}>
                      {discountPct < 0 ? "Interés" : "Descuento"}{" "}
                      {Math.abs(Math.round(discountPct))}%
                      {discountMotivo.trim() ? ` — ${discountMotivo.trim()}` : ""}
                    </span>
                    <span
                      className={`min-w-[110px] text-right ${
                        discountPct < 0 ? "text-amber-700" : "text-red-600"
                      }`}
                    >
                      {discountPct < 0 ? "+" : "−"} {formatAmount(Math.abs(discountAmount))}
                    </span>
                  </div>
                  <div className="flex gap-6 mt-1 text-[14px]">
                    <span className="text-gray-600">
                      {discountPct < 0 ? "Total con interés" : "Total con descuento"}
                    </span>
                    <span
                      className={`min-w-[110px] text-right text-[16px] font-medium ${
                        discountPct < 0 ? "text-amber-700" : "text-[#3B6D11]"
                      }`}
                    >
                      {formatAmount(newTotal)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex gap-6 text-[14px]">
                  <span>Nuevo total</span>
                  <span className="min-w-[110px] text-right text-[16px] font-medium text-black">
                    {formatAmount(newTotal)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {displayedError && (
            <p
              role="alert"
              className="mb-4 text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            >
              {displayedError}
            </p>
          )}

          <div className="flex justify-end gap-3">
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
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}

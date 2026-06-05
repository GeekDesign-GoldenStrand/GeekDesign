"use client";

import React, { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import type { FormulaVariable, LineItem } from "@/types/cotizacion";

function formatAmount(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

interface EditarVariablesDetalleProps {
  idCotizacion: number;
  isOpen: boolean;
  servicio: LineItem | null;
  onSaved: (result: {
    id_detalle: number;
    precio_unitario: number;
    subtotal: number;
    variables: FormulaVariable[];
  }) => void;
  onClose: () => void;
}

interface DraftVariable {
  id_variable: number;
  nombre_variable: string;
  etiqueta: string;
  unidad?: string;
  valor: number;
  raw: string; // mirrors the input box so the user can clear it mid-edit
}

const PREVIEW_DEBOUNCE_MS = 350;

export default function EditarVariablesDetalle({
  idCotizacion,
  isOpen,
  servicio,
  onSaved,
  onClose,
}: EditarVariablesDetalleProps) {
  // The draft variables shadow LineItem.variables but track the raw input
  // string too, so a half-typed value like "" or "1." doesn't get clobbered
  // back to a parsed number on every keystroke.
  const [draft, setDraft] = useState<DraftVariable[]>([]);
  const [snapshot, setSnapshot] = useState<DraftVariable[]>([]);
  const [previewPrecio, setPreviewPrecio] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset all local state every time the modal opens against a new servicio.
  useEffect(() => {
    if (!isOpen || !servicio) return;
    const fresh: DraftVariable[] = servicio.variables.map((v) => ({
      id_variable: v.id_variable,
      nombre_variable: v.nombre_variable,
      etiqueta: v.etiqueta,
      unidad: v.unidad,
      valor: v.valor,
      raw: String(v.valor),
    }));
    setDraft(fresh);
    setSnapshot(fresh);
    setPreviewPrecio(servicio.precio_unitario);
    setPreviewError(null);
    setSubmitError(null);
    setPreviewing(false);
  }, [isOpen, servicio]);

  // Debounced live recompute: every edit re-asks the server for the price.
  // Using the real endpoint (not a client-side eval) keeps the preview in
  // lock-step with what the PATCH will commit a moment later.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!isOpen || !servicio || draft.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    const allParse = draft.every((d) => Number.isFinite(d.valor) && d.valor > 0);
    if (!allParse) {
      setPreviewError("Todos los valores deben ser mayores que 0");
      setPreviewing(false);
      return;
    }
    setPreviewError(null);

    timerRef.current = setTimeout(async () => {
      const reqId = ++reqIdRef.current;
      setPreviewing(true);
      try {
        const res = await fetch(`/api/servicios/${servicio.id_servicio}/calcular-precio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_material: servicio.id_material,
            variables: draft.map((d) => ({
              nombre_variable: d.nombre_variable,
              valor: d.valor,
            })),
          }),
        });
        // Drop stale responses if the user has typed again since this request fired.
        if (reqId !== reqIdRef.current) return;
        const json: { data?: { precioUnitario: number }; error?: string } = await res.json();
        if (!res.ok) {
          setPreviewError(json.error ?? "No se pudo calcular el precio");
          return;
        }
        setPreviewPrecio(json.data?.precioUnitario ?? null);
      } catch (err) {
        if (reqId !== reqIdRef.current) return;
        setPreviewError(err instanceof Error ? err.message : "Error de red");
      } finally {
        if (reqId === reqIdRef.current) setPreviewing(false);
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, isOpen, servicio]);

  if (!isOpen || !servicio) return null;

  // Capture into a local so the handlers declared below close over a non-null
  // value — TypeScript will not narrow `servicio` (a possibly-null prop)
  // across function declarations even after the early return.
  const s = servicio;

  const dirty =
    draft.length !== snapshot.length || draft.some((d, i) => d.valor !== snapshot[i]?.valor);

  const previewSubtotal =
    previewPrecio !== null ? Math.round(previewPrecio * s.cantidad * 100) / 100 : s.subtotal;

  function setVariable(idx: number, raw: string) {
    setSubmitError(null);
    setDraft((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        // Parse with parseFloat so "1.5" reads correctly; if the user has
        // typed something unparseable (or cleared the field) we keep the raw
        // string and mark valor NaN — the preview guard above stops the fetch.
        const parsed = parseFloat(raw);
        return { ...d, raw, valor: Number.isFinite(parsed) ? parsed : Number.NaN };
      })
    );
  }

  async function handleConfirm() {
    if (!dirty) {
      onClose();
      return;
    }
    const invalid = draft.find((d) => !(Number.isFinite(d.valor) && d.valor > 0));
    if (invalid) {
      setSubmitError(`"${invalid.etiqueta}" debe ser mayor que 0`);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(
        `/api/cotizaciones/${idCotizacion}/detalles/${s.id_detalle}/variables`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variables: draft.map((d) => ({ id_variable: d.id_variable, valor: d.valor })),
          }),
        }
      );
      const json: {
        data?: { detalle: { precio_unitario: string; subtotal: string }; monto_total: number };
        error?: string;
      } = await res.json();

      if (!res.ok) {
        const fallback =
          res.status === 404
            ? "Detalle no encontrado"
            : res.status === 409
              ? "No se puede modificar esta cotización en su estatus actual"
              : "No se pudieron guardar los cambios";
        setSubmitError(json.error ?? fallback);
        return;
      }

      const nuevoPrecio = parseFloat(json.data!.detalle.precio_unitario);
      const nuevoSubtotal = parseFloat(json.data!.detalle.subtotal);

      onSaved({
        id_detalle: s.id_detalle,
        precio_unitario: nuevoPrecio,
        subtotal: nuevoSubtotal,
        variables: draft.map((d) => ({
          id_variable: d.id_variable,
          nombre_variable: d.nombre_variable,
          etiqueta: d.etiqueta,
          unidad: d.unidad,
          // editable_por_cliente comes from the catalog, not this edit; carry
          // it through from the original variable definition.
          editable_por_cliente:
            s.variables.find((v) => v.id_variable === d.id_variable)?.editable_por_cliente ?? false,
          valor: d.valor,
        })),
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error de red al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title="Editar variables del servicio" onClose={onClose}>
      <div className="mb-4">
        <p className="text-[13px] font-medium text-gray-900">{servicio.nombre_servicio}</p>
        <p className="text-[12px] text-gray-500">{servicio.nombre_material}</p>
      </div>

      {servicio.formula_expresion && (
        <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-1">
            Fórmula
          </p>
          <code className="block text-[12px] text-gray-700 font-mono break-all">
            {servicio.formula_expresion}
          </code>
        </div>
      )}

      <div className="mb-4">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">
          Variables
        </p>
        {draft.length === 0 ? (
          <p className="text-[13px] text-gray-500">Este servicio no tiene variables editables.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {draft.map((v, idx) => (
              <label
                key={v.id_variable}
                className="grid grid-cols-[1fr_auto] items-center gap-3 text-[13px] text-[#575757]"
              >
                <span className="font-medium">
                  {v.etiqueta}
                  {v.unidad ? (
                    <span className="text-gray-400 font-normal"> ({v.unidad})</span>
                  ) : null}
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={v.raw}
                  onChange={(e) => setVariable(idx, e.target.value)}
                  className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="flex justify-between text-[13px] text-gray-500">
          <span>Cantidad</span>
          <span className="text-gray-800">{servicio.cantidad}</span>
        </div>
        <div className="flex justify-between text-[13px] text-gray-500">
          <span>Precio unitario {previewing ? "(calculando…)" : ""}</span>
          <span className="text-gray-800">
            {previewPrecio !== null ? formatAmount(previewPrecio) : "—"}
          </span>
        </div>
        <div className="flex justify-between text-[14px] mt-1">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-[16px] text-black">
            {formatAmount(previewSubtotal)}
          </span>
        </div>
        {previewError && <p className="mt-2 text-[12px] text-amber-700">{previewError}</p>}
      </div>

      {submitError && (
        <p
          role="alert"
          className="mb-4 text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {submitError}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          disabled={submitting || draft.length === 0}
          loading={submitting}
        >
          {submitting ? "Guardando…" : "Confirmar"}
        </Button>
      </div>
    </ModalShell>
  );
}

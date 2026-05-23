import React, { useEffect, useMemo, useState } from "react";

import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import type { LineItem } from "@/lib/utils/cotizacion";

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

interface EditarCotizacionProps {
  idCotizacion: number;
  isOpen: boolean;
  initial: EditableFields;
  currentCliente?: ClienteOption;
  porcentajeDescuento?: number | null;
  motivoDescuento?: string | null;
  onSave: (data: EditableFields) => void;
  onClose: () => void;
}

export default function EditarCotizacion({
  idCotizacion,
  isOpen,
  initial,
  currentCliente,
  porcentajeDescuento,
  motivoDescuento,
  onSave,
  onClose,
}: EditarCotizacionProps) {
  const [fields, setFields] = useState<EditableFields>({
    ...initial,
    servicios: initial.servicios.map((p) => ({ ...p })),
  });
  const [clientes, setClientes] = useState<ClienteOption[]>(currentCliente ? [currentCliente] : []);
  const [clientesError, setClientesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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
    setClientesError(null);
    setServerError(null);
    setValidationError(null);
  }, [isOpen, initial]);

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
  const discountPct = porcentajeDescuento ?? 0;
  const hasDiscount = discountPct > 0;
  const discountAmount = hasDiscount ? Math.round(newSubtotal * discountPct) / 100 : 0;
  const newTotal = newSubtotal - discountAmount;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setValidationError(null);

    // ── Client-side validations ───────────────────────────────────────────
    if (fields.fecha_fin && fields.fecha_fin < today) {
      setValidationError("La fecha de entrega no puede ser en el pasado.");
      return;
    }

    if (fieldsAreEqual(fields, snapshot)) {
      setValidationError("No has realizado ningún cambio.");
      return;
    }

    setIsSubmitting(true);
    try {
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

      alert("Cotización actualizada correctamente");
      onSave(fields);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error de red al guardar los cambios");
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayedError = validationError ?? serverError;

  return (
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
            <select
              value={fields.id_cliente}
              onChange={(e) => setField("id_cliente", Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre_cliente}
                  {c.empresa ? ` — ${c.empresa}` : ""}
                </option>
              ))}
            </select>
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
                      type="number"
                      min={1}
                      step={1}
                      value={item.cantidad}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        const safe = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
                        updateServicio(idx, "cantidad", safe);
                      }}
                      className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.precio_unitario}
                      onChange={(e) =>
                        updateServicio(idx, "precio_unitario", parseFloat(e.target.value) || 0)
                      }
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
                  <span title={motivoDescuento ?? undefined}>
                    Descuento {Math.round(discountPct)}%
                    {motivoDescuento ? ` — ${motivoDescuento}` : ""}
                  </span>
                  <span className="min-w-[110px] text-right text-red-600">
                    − {formatAmount(discountAmount)}
                  </span>
                </div>
                <div className="flex gap-6 mt-1 text-[14px]">
                  <span className="text-gray-600">Total con descuento</span>
                  <span className="min-w-[110px] text-right text-[16px] font-medium text-[#3B6D11]">
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
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-[14px] font-medium text-white bg-[rgba(0,106,255,0.85)] rounded-[7px] hover:bg-[#006aff] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

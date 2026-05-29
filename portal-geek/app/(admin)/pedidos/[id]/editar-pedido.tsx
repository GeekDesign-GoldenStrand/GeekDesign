"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";
import type { Pedido } from "@/types/pedido";

const PEDIDO_STATUS_OPTIONS = [
  "Pendiente",
  "En producción",
  "Finalizado",
  "Entregado",
  "Cancelado",
] as const;

interface SucursalOption {
  id_sucursal: number;
  nombre_sucursal: string;
}

export interface EditablePedidoFields {
  estatus: string;
  id_sucursal: string;
  fecha_estimada: string;
  fecha_fin: string;
  facturado: boolean;
  numero_factura: string;
  notas: string;
}

function fieldsFromPedido(pedido: Pedido["pedido"]): EditablePedidoFields {
  return {
    estatus: pedido.estatus.descripcion,
    id_sucursal: pedido.id_sucursal != null ? String(pedido.id_sucursal) : "",
    fecha_estimada: pedido.fecha_estimada?.slice(0, 10) ?? "",
    fecha_fin: pedido.fecha_fin?.slice(0, 10) ?? "",
    facturado: pedido.facturado,
    numero_factura: pedido.numero_factura ?? "",
    notas: pedido.notas ?? "",
  };
}

interface Props {
  idPedido: number;
  pedido: Pedido["pedido"];
  isOpen: boolean;
  onSave: () => Promise<void>;
  onClose: () => void;
}

export default function EditarPedido({ idPedido, pedido, isOpen, onSave, onClose }: Props) {
  const [fields, setFields] = useState<EditablePedidoFields>(() => fieldsFromPedido(pedido));
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [sucursalesError, setSucursalesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [snapshot, setSnapshot] = useState<EditablePedidoFields>(() => fieldsFromPedido(pedido));

  useEffect(() => {
    if (!isOpen) return;
    const fresh = fieldsFromPedido(pedido);
    setFields(fresh);
    setSnapshot(fresh);
    setServerError(null);
  }, [isOpen, pedido]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sucursales?mode=options");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: { data: SucursalOption[] } = await res.json();
        if (!cancelled) setSucursales(json.data ?? []);
      } catch (err) {
        if (!cancelled)
          setSucursalesError(err instanceof Error ? err.message : "Error cargando sucursales");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const setField = <K extends keyof EditablePedidoFields>(
    key: K,
    value: EditablePedidoFields[K]
  ) => {
    setServerError(null);
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const statusChanged = fields.estatus !== snapshot.estatus;
    const otherChanged =
      fields.id_sucursal !== snapshot.id_sucursal ||
      fields.fecha_estimada !== snapshot.fecha_estimada ||
      fields.fecha_fin !== snapshot.fecha_fin ||
      fields.facturado !== snapshot.facturado ||
      fields.numero_factura !== snapshot.numero_factura ||
      fields.notas !== snapshot.notas;

    if (!statusChanged && !otherChanged) {
      setServerError("No has realizado ningún cambio.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (statusChanged) {
        const res = await fetch(`/api/pedidos/${idPedido}/estatus`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estatus: fields.estatus }),
        });
        if (!res.ok) {
          let payload: { error?: string } = {};
          try {
            payload = await res.json();
          } catch {
            /* non-JSON */
          }
          throw new Error(payload.error ?? "No se pudo cambiar el estatus");
        }
      }

      if (otherChanged) {
        const body: Record<string, unknown> = {};
        if (fields.id_sucursal) body.id_sucursal = Number(fields.id_sucursal);
        if (fields.fecha_estimada) body.fecha_estimada = fields.fecha_estimada;
        if (fields.fecha_fin) body.fecha_fin = fields.fecha_fin;
        body.facturado = fields.facturado;
        if (fields.numero_factura) body.numero_factura = fields.numero_factura;
        if (fields.notas) body.notas = fields.notas;

        const res = await fetch(`/api/pedidos/${idPedido}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          let payload: { error?: string } = {};
          try {
            payload = await res.json();
          } catch {
            /* non-JSON */
          }
          throw new Error(payload.error ?? "No se pudieron guardar los cambios");
        }
      }

      await onSave();
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusOptions = PEDIDO_STATUS_OPTIONS;

  return (
    <ModalShell title="Editar pedido" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="flex flex-col gap-1 col-span-2 text-[13px] text-[#575757]">
            <span className="font-medium">Estatus</span>
            <select
              value={fields.estatus}
              onChange={(e) => setField("estatus", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 col-span-2 text-[13px] text-[#575757]">
            <span className="font-medium">Sucursal</span>
            <select
              value={fields.id_sucursal}
              onChange={(e) => setField("id_sucursal", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Sin sucursal</option>
              {sucursales.map((s) => (
                <option key={s.id_sucursal} value={String(s.id_sucursal)}>
                  {s.nombre_sucursal}
                </option>
              ))}
            </select>
            {sucursalesError && (
              <span className="text-[11px] text-red-600 mt-0.5">
                No se pudo cargar la lista de sucursales ({sucursalesError}).
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-[13px] text-[#575757]">
            <span className="font-medium">Fecha estimada</span>
            <input
              type="date"
              value={fields.fecha_estimada}
              onChange={(e) => setField("fecha_estimada", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-[13px] text-[#575757]">
            <span className="font-medium">Fecha fin / entrega</span>
            <input
              type="date"
              value={fields.fecha_fin}
              onChange={(e) => setField("fecha_fin", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {pedido.factura && (
            <>
              <label className="flex items-center gap-2 col-span-2 text-[13px] text-[#575757] cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.facturado}
                  onChange={(e) => setField("facturado", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#e42200]"
                />
                <span className="font-medium">Facturado</span>
              </label>

              <label className="flex flex-col gap-1 col-span-2 text-[13px] text-[#575757]">
                <span className="font-medium">Número de factura</span>
                <input
                  type="text"
                  value={fields.numero_factura}
                  onChange={(e) => setField("numero_factura", e.target.value)}
                  placeholder="Ej. FAC-2024-001"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </>
          )}

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

        {serverError && (
          <p
            role="alert"
            className="mb-4 text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          >
            {serverError}
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
  );
}

import React, { useState, useCallback } from "react";

import EditarCotizacion from "@/app/(admin)/cotizaciones/[id]/editar-cotizacion";
import type { EditableFields } from "@/app/(admin)/cotizaciones/[id]/editar-cotizacion";
import { ConfirmDialog } from "@/components/ui/atoms/ConfirmDialog";
import { SuccessModal } from "@/components/ui/atoms/SuccessModal";
import type { UserRole } from "@/types";
import {
  QUOTATION_STATUS,
  type Cotizacion,
  type FormulaVariable,
  type HistorialEstado,
  type LineItem,
} from "@/types/cotizacion";

import { ClientCard } from "../molecules/ClientCard";
import { GeneralDataCard } from "../molecules/GeneralDataCard";
import { HistoryCard } from "../molecules/HistoryCard";
import { LineItemsTable } from "../molecules/LineItemsTable";
import { NotasCard } from "../molecules/NotasCard";
import { CotizacionHeader } from "../organisms/CotizacionHeader";
import { CotizacionSummary } from "../organisms/CotizacionSummary";

type ActivePanel = "edit" | null;

interface CotizacionDetailPageProps {
  cotizacion: Cotizacion;
  userRole?: UserRole;
  onRefetch?: () => Promise<void> | void;
}

export function CotizacionDetailPage({
  cotizacion,
  userRole,
  onRefetch,
}: CotizacionDetailPageProps) {
  // ── Panel visibility ──────────────────────
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const togglePanel = (panel: ActivePanel) =>
    setActivePanel((prev) => (prev === panel ? null : panel));

  // ── Map API detalles → servicios ───────────
  const variablesByDetalle = cotizacion.variablesCotizacion.reduce(
    (acc: Record<number, FormulaVariable[]>, v) => {
      if (v.id_detalle == null) return acc;
      const fv: FormulaVariable = {
        id_variable: v.variable.id_variable,
        nombre_variable: v.variable.nombre_variable,
        etiqueta: v.variable.etiqueta,
        unidad: v.variable.unidad ?? undefined,
        editable_por_cliente: v.variable.editable_por_cliente,
        valor: parseFloat(v.valor),
      };
      acc[v.id_detalle] = [...(acc[v.id_detalle] ?? []), fv];
      return acc;
    },
    {} as Record<number, FormulaVariable[]>
  );

  const servicios: LineItem[] = (cotizacion.pedido?.detalles ?? []).map((d) => ({
    id_detalle: d.id_detalle,
    nombre_servicio: d.servicio.nombre_servicio,
    nombre_material: d.material.nombre_material,
    cantidad: d.cantidad,
    precio_unitario: parseFloat(d.precio_unitario),
    subtotal: parseFloat(d.subtotal),
    notas: d.notas ?? undefined,
    variables: variablesByDetalle[d.id_detalle] ?? [],
    archivo_url: d.archivo?.url_archivo,
    archivo_nombre: d.archivo?.nombre_archivo,
    archivo_id: d.archivo?.id_archivo,
  }));

  // ── Map API historial ─────────────────────
  const historial: HistorialEstado[] = cotizacion.historial.map((h) => ({
    id_historial: h.id_historial,
    id_estado_anterior: h.id_estado_anterior,
    id_estado_nuevo: h.id_estado_nuevo,
    estado_anterior_label: h.estado_anterior_label ?? undefined,
    estado_nuevo_label: h.estado_nuevo_label,
    usuario_nombre: h.usuario?.nombre_completo ?? h.cliente?.nombre_cliente ?? "Sistema",
    actor_tipo: h.actor_tipo,
    fecha_cambio: h.fecha_cambio,
  }));

  // ── Editable fields ───────────────────────
  const [fields, setFields] = useState<EditableFields>({
    id_cliente: cotizacion.id_cliente,
    nombre_oportunidad: cotizacion.nombre_oportunidad ?? "",
    fecha_fin: cotizacion.fecha_fin?.slice(0, 10) ?? "",
    notas: cotizacion.notas ?? "",
    servicios,
  });

  const handleSave = useCallback(
    async (updated: EditableFields) => {
      setFields(updated);
      await onRefetch?.();
      setActivePanel(null);
    },
    [onRefetch]
  );

  // ── Discount/surcharge (COT-06) ───────────
  // porcentajeDescuento is signed: positive = discount (reduces total),
  // negative = interest/surcharge (raises total). Labels flip on the sign.
  const serviciosSubtotal = fields.servicios.reduce((acc, p) => acc + p.subtotal, 0);
  const montoTotalActual = parseFloat(cotizacion.monto_total);
  const porcentajeDescuento = cotizacion.porcentaje_descuento
    ? parseFloat(cotizacion.porcentaje_descuento)
    : 0;
  const baseAmount = serviciosSubtotal || montoTotalActual;
  const hasAdjustment = porcentajeDescuento !== 0;
  const adjustmentAmount = hasAdjustment ? baseAmount - montoTotalActual : 0;
  const adjustmentLabel = hasAdjustment
    ? `${porcentajeDescuento < 0 ? "Interés" : "Descuento"} ${Math.abs(
        Math.round(porcentajeDescuento)
      )}%${cotizacion.motivo_descuento ? ` — ${cotizacion.motivo_descuento}` : ""}`
    : "";

  const handleDiscountApplied = useCallback(async () => {
    await onRefetch?.();
  }, [onRefetch]);

  // "Creada por" = the actor who created the quote, NOT the cliente the
  // quote is for. The Cotizaciones row has no id_usuario_creador column —
  // the canonical signal is the historial entry with no previous state
  // (id_estado_anterior === null). Historial is fetched in fecha_cambio
  // asc order (lib/services/cotizaciones.ts), so the creation entry is
  // also historial[0]; we search by id_estado_anterior for robustness in
  // case ordering ever changes. Same actor-resolution fallback chain as
  // the historial map above (usuario → cliente → "Sistema").
  const creationEntry =
    cotizacion.historial.find((h) => h.id_estado_anterior == null) ?? cotizacion.historial[0];
  const creadoPor =
    creationEntry?.usuario?.nombre_completo ?? creationEntry?.cliente?.nombre_cliente ?? "Sistema";

  // Edits, adding a discount, and removing a discount all share the same
  // server-side Pendiente-only rule (see updateCotizacion + aplicarDescuento).
  // Derive once and pass to each gate so the UI stops offering actions the
  // server would refuse. Comparing against the constant — not the literal
  // — keeps this in lock-step with the backend if the catalog string ever
  // changes.
  const isMutable = cotizacion.estatus.descripcion === QUOTATION_STATUS.PENDIENTE;

  const canEditDiscount = userRole === "Direccion";
  const canManageDiscount = isMutable && canEditDiscount;

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteDiscountModal, setShowDeleteDiscountModal] = useState(false);
  const [isDeletingDiscount, setIsDeletingDiscount] = useState(false);
  const [deleteDiscountError, setDeleteDiscountError] = useState<string | null>(null);

  const handleConfirmDeleteDiscount = async () => {
    setIsDeletingDiscount(true);
    setDeleteDiscountError(null);
    try {
      const res = await fetch(`/api/cotizaciones/${cotizacion.id_cotizacion}/descuento`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          porcentaje_descuento: null,
          motivo_descuento: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteDiscountError(data.error ?? "No se pudo eliminar el ajuste.");
        return;
      }

      setShowDeleteDiscountModal(false);
      await onRefetch?.();
      setShowSuccessModal(true);
    } catch (err) {
      setDeleteDiscountError(err instanceof Error ? err.message : "Error de red al eliminar.");
    } finally {
      setIsDeletingDiscount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 font-sans">
      <CotizacionHeader
        folio={cotizacion.folio}
        nombreOportunidad={fields.nombre_oportunidad || cotizacion.nombre_oportunidad}
        canEdit={isMutable}
        onEdit={() => togglePanel("edit")}
      />

      <EditarCotizacion
        idCotizacion={cotizacion.id_cotizacion}
        isOpen={activePanel === "edit"}
        initial={fields}
        currentCliente={{
          id_cliente: cotizacion.cliente.id_cliente,
          nombre_cliente: cotizacion.cliente.nombre_cliente,
          empresa: cotizacion.cliente.empresa,
        }}
        porcentajeDescuento={porcentajeDescuento || null}
        motivoDescuento={cotizacion.motivo_descuento}
        userRole={userRole}
        onSave={handleSave}
        onClose={() => setActivePanel(null)}
        onDiscountApplied={handleDiscountApplied}
        onSuccess={() => {
          // Success modal triggered
          setShowSuccessModal(true);
        }}
      />

      <CotizacionSummary
        montoTotal={montoTotalActual}
        porcentajeDescuento={porcentajeDescuento || null}
        motivoDescuento={cotizacion.motivo_descuento}
        fechaCreacion={cotizacion.fecha_creacion}
        fechaEntrega={fields.fecha_fin || cotizacion.fecha_fin}
        servicios={fields.servicios}
        // Trash icon on the discount ribbon is only wired when the quote
        // can still be mutated AND the viewer is Direccion.
        onDeleteDiscount={canManageDiscount ? () => setShowDeleteDiscountModal(true) : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ClientCard
          cliente={cotizacion.cliente}
          empresaCotizacion={cotizacion.empresa_cliente ?? undefined}
        />
        <GeneralDataCard
          cotizacion={{
            folio: cotizacion.folio,
            nombre_oportunidad: fields.nombre_oportunidad || cotizacion.nombre_oportunidad,
            estatus_label: cotizacion.estatus.descripcion,
            creado_por: creadoPor,
            fecha_fin: fields.fecha_fin || cotizacion.fecha_fin,
            fecha_validacion: cotizacion.fecha_validacion,
            fecha_aprobacion: cotizacion.fecha_aprobacion,
            pdf_url: cotizacion.pdf_url,
          }}
        />
      </div>

      <div className="mb-4">
        <LineItemsTable
          servicios={fields.servicios}
          discountAmount={adjustmentAmount || undefined}
          discountLabel={adjustmentLabel || undefined}
        />
      </div>

      <div className="mb-4">
        <HistoryCard historial={historial} />
      </div>

      {(fields.notas || cotizacion.notas) && (
        <NotasCard notas={fields.notas || cotizacion.notas!} />
      )}

      {showDeleteDiscountModal && (
        <ConfirmDialog
          isOpen={true}
          title={`Eliminar ${porcentajeDescuento < 0 ? "interés" : "descuento"}`}
          description={`¿Estás seguro de que deseas eliminar este ${porcentajeDescuento < 0 ? "interés" : "descuento"}?`}
          confirmLabel="Eliminar"
          loading={isDeletingDiscount}
          error={deleteDiscountError}
          onConfirm={handleConfirmDeleteDiscount}
          onClose={() => setShowDeleteDiscountModal(false)}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          message="¡Cotización actualizada con éxito!"
          onClose={() => setShowSuccessModal(false)}
          variant="success"
        />
      )}
    </div>
  );
}

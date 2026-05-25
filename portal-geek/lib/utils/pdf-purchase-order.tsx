import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import {
  PurchaseOrderTemplate,
  type POLineItem,
  type PurchaseOrderTemplateProps,
} from "@/components/pdf/templates/PurchaseOrderTemplate";

// ─── Input types ──────────────────────────────────────────────────────────────
// Deliberately separate from the template's prop types so the calling layer
// (API routes, services) is decoupled from the PDF renderer's internal shape.

export interface POPartyInput {
  nombre: string;
  empresa?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
}

/** Each item as received from the caller — without the derived `subtotal`. */
export interface POItemInput {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export interface GeneratePurchaseOrderPDFParams {
  /** Proveedor o instalador externo que recibe la orden. */
  vendedor: POPartyInput;
  /**
   * Sucursal de Geek Design que emite la orden.
   * `direccion` es obligatoria para documentos legales.
   */
  cliente: POPartyInput & { direccion: string };
  items: POItemInput[];
  /** Número único de la orden, e.g. "OC-2026-00001". */
  numero_orden: string;
  fecha: Date;
  /** INCOTERM o condición de entrega pactada (EXW, DDP…). */
  condiciones_entrega?: string;
  forma_pago?: string;
  /** ISO date string o valor legible; se formatea en el PDF. */
  fecha_envio?: string;
  notas?: string;
}

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Renders a Purchase Order (Orden de Compra Interna) to a PDF Buffer in memory.
 * No file system or S3 I/O — the bytes are returned directly to the caller.
 *
 * Financial calculations performed here (source of truth for the document):
 *   item.subtotal    = cantidad × precio_unitario
 *   subtotal_general = Σ item.subtotal
 *   iva              = subtotal_general × 0.16
 *   total            = subtotal_general + iva
 *
 * @returns Node.js `Buffer` containing the PDF bytes.
 */
export async function generatePurchaseOrderPDF(
  params: GeneratePurchaseOrderPDFParams
): Promise<Buffer> {
  const {
    vendedor,
    cliente,
    items,
    numero_orden,
    fecha,
    condiciones_entrega,
    forma_pago,
    fecha_envio,
    notas,
  } = params;

  // 1. Compute per-item subtotals — never trust client-supplied totals.
  const pricedItems: POLineItem[] = items.map((item) => ({
    ...item,
    subtotal: item.cantidad * item.precio_unitario,
  }));

  // 2. Compute financial summary here — single source of truth.
  //    The template receives these as props and renders them verbatim.
  const { subtotal_general, iva, total } = calcularTotalesOrden(items);

  // 3. Map input params to template props.
  //    `cliente.nombre` → `comprador.nombre_sucursal` is the only renaming needed.
  const templateProps: PurchaseOrderTemplateProps = {
    po_number: numero_orden,
    fecha,
    condiciones_entrega,
    forma_pago,
    fecha_envio,
    notas,
    vendedor,
    comprador: {
      nombre_sucursal: cliente.nombre,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      correo: cliente.correo,
    },
    items: pricedItems,
    subtotal_general,
    iva,
    total,
  };

  // 4. Render to an in-memory buffer.
  //    renderToBuffer resolves once the PDF is fully assembled — no streaming needed.
  const buffer = await renderToBuffer(<PurchaseOrderTemplate {...templateProps} />);

  // Buffer.from() normalises the result whether react-pdf returns Buffer or Uint8Array.
  return Buffer.from(buffer);
}

// ─── Re-export financial summary helper for callers that need the numbers ──────
// (e.g. to persist subtotal_general / total before generating the PDF)

export function calcularTotalesOrden(items: POItemInput[]): {
  subtotal_general: number;
  iva: number;
  total: number;
} {
  const subtotal_general = items.reduce(
    (sum, item) => sum + item.cantidad * item.precio_unitario,
    0
  );
  const iva = subtotal_general * 0.16;
  const total = subtotal_general + iva;
  return { subtotal_general, iva, total };
}

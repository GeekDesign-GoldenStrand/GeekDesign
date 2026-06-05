// ─────────────────────────────────────────────
// Cotización — shared TypeScript types
// Mirrors the current Prisma schema (Formula Engine v3)
//
// Notable schema invariants reflected here:
//   - DetallePedido no longer holds dimensions/options (D3).
//     Sizing/options live in VariablesCotizacion (id_detalle FK).
//   - VariablesCotizacion.variable points to FormulaVariables
//     (renamed from id_formula → id_variable).
//   - HistorialEstadosCotizacion has actor_tipo + nullable
//     usuario/cliente so client actions can be attributed.
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Catálogo de estatus de cotización
//
// Single source of truth shared by both layers:
//   - Backend (lib/services/cotizaciones.ts) uses the const for status
//     guards, transition tables, and Prisma lookups.
//   - Frontend (CotizacionDetailPage et al.) uses the const so a status
//     rename in the catalog flows through without per-file edits.
//
// The DB column (EstatusCotizacion.descripcion) is VARCHAR(50) with no
// FK / CHECK, so any string can technically land there. Treat values
// read from the DB as `string` and narrow with `toEstatusCotizacion`
// before consuming them as the union type.
// ─────────────────────────────────────────────
export const QUOTATION_STATUS = {
  PENDIENTE: "Pendiente",
  VALIDADA: "Validada",
  RECHAZADA: "Rechazada",
  APROBADA: "Aprobada",
  CANCELADA: "Cancelada",
} as const;

export type EstatusCotizacion = (typeof QUOTATION_STATUS)[keyof typeof QUOTATION_STATUS];
// Alias kept for the back-end that historically called the type
// `QuotationStatus` — same underlying union, just a different name.
export type QuotationStatus = EstatusCotizacion;

const QUOTATION_STATUS_VALUES = Object.values(QUOTATION_STATUS) as readonly string[];

// Runtime predicate — use before casting any DB-sourced descripcion to
// EstatusCotizacion. Cheap O(5) lookup against the catalog.
export function isEstatusCotizacion(value: unknown): value is EstatusCotizacion {
  return typeof value === "string" && QUOTATION_STATUS_VALUES.includes(value);
}

// Narrowing helper: returns the value typed as EstatusCotizacion when it
// matches the catalog, otherwise `null`. Lets callers fall back to a
// safe default instead of pretending an unknown string is in the union.
export function toEstatusCotizacion(value: unknown): EstatusCotizacion | null {
  return isEstatusCotizacion(value) ? value : null;
}

export type CategoriaCliente = "Black" | "Silver" | "Gold" | "Emprendedor" | "Baneado";

export type ActorTipo = "Direccion" | "Cliente";

// ── Atoms / primitives ───────────────────────

export interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
  empresa: string | null;
  rfc: string | null;
  correo_electronico: string;
  numero_telefono: string;
  categoria: CategoriaCliente | null;
}

export interface HistorialEstado {
  id_historial: number;
  id_estado_anterior: number | null;
  id_estado_nuevo: number;
  estado_anterior_label?: string;
  estado_nuevo_label: string;
  usuario_nombre: string;
  actor_tipo: ActorTipo;
  fecha_cambio: string;
}

// Mirrors FormulaVariables resolved from VariablesCotizacion.
export interface FormulaVariable {
  id_variable: number;
  nombre_variable: string;
  etiqueta: string;
  unidad?: string;
  editable_por_cliente: boolean;
  valor: number; // resolved from VariablesCotizacion.valor
}

export interface LineItem {
  id_detalle: number;
  // id_servicio + id_material are required by the per-detalle variable editor:
  // POST /api/servicios/[id]/calcular-precio needs the servicio in the URL
  // and the material in the body to recompute the price as the admin types.
  id_servicio: number;
  id_material: number;
  nombre_servicio: string;
  nombre_material: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  // VariablesCotizacion entries linked to this detalle, resolved to the
  // FormulaVariable shape so the table can render their pills inline.
  variables: FormulaVariable[];
  // Active formula expression for this servicio — shown read-only at the top
  // of the per-detalle variable editor so the admin can see what the values
  // are feeding. Optional because a detalle's servicio may have lost its
  // active formula by the time we render (rare but defensible).
  formula_expresion?: string;
  // ArchivosDisenio attached to this detalle. Optional because legacy
  // detalles created before the placeholder upload existed could be null
  // (Prisma model guarantees the relation, but defensive on the client).
  archivo_id?: number;
  archivo_url?: string;
  archivo_nombre?: string;
}

// ── Cotización aggregate ─────────────────────

export interface Cotizacion {
  id_cotizacion: number;
  id_pedido: number | null;
  id_cliente: number;
  id_estatus_cotizacion: number;
  folio: string | null;
  monto_total: string; // comes as string from Prisma Decimal
  porcentaje_descuento: string | null; // Decimal(5,2) — applied % discount
  motivo_descuento: string | null; // free-form reason captured with the discount
  nombre_oportunidad: string | null;
  empresa_cliente: string | null;
  fecha_creacion: string;
  fecha_fin: string | null;
  fecha_validacion: string | null;
  fecha_aprobacion: string | null;
  pdf_url: string | null;
  notas: string | null;

  cliente: Cliente;

  estatus: {
    id_estatus: number;
    descripcion: string;
  };

  pedido: {
    id_pedido: number;
    detalles: {
      id_detalle: number;
      id_servicio: number;
      id_material: number;
      cantidad: number;
      precio_unitario: string;
      subtotal: string;
      responsable_recoleccion: string;
      notas: string | null;
      servicio: { nombre_servicio: string };
      material: { nombre_material: string };
      archivo: {
        id_archivo: number;
        nombre_archivo: string;
        url_archivo: string;
      };
    }[];
  } | null;

  historial: {
    id_historial: number;
    id_estado_anterior: number | null;
    id_estado_nuevo: number;
    estado_anterior_label: string | null;
    estado_nuevo_label: string;
    fecha_cambio: string;
    actor_tipo: ActorTipo;
    usuario: { nombre_completo: string } | null;
    cliente: { nombre_cliente: string } | null;
  }[];

  variablesCotizacion: {
    id_valor: number;
    id_detalle: number | null;
    valor: string;
    fecha_asignacion: string;
    variable: {
      id_variable: number;
      nombre_variable: string;
      etiqueta: string;
      unidad: string | null;
      editable_por_cliente: boolean;
      // Formula relation comes from DETAIL_INCLUDE on the admin GET — used by
      // the per-detalle variable editor to show the active formula expression.
      // Storefront callers that use a narrower include can leave this absent.
      formula?: { expresion: string };
    };
    usuario: { nombre_completo: string } | null;
  }[];

  rechazada: { fecha_rechazo: string } | null;
}

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

export type EstatusCotizacion = "Pendiente" | "Validada" | "Aprobada" | "Rechazada" | "Cancelada";

export type CategoriaCliente = "Black" | "Silver" | "Gold" | "Emprendedor" | "Baneado";

export type ActorTipo = "Direccion" | "Cliente";

export const STATUS_COLORS: Record<EstatusCotizacion, string> = {
  Pendiente: "bg-[#F7B9FF]/70 text-[#D83CFF]",
  Validada: "bg-[#B9EAFF] text-[#0D7794]",
  Rechazada: "bg-[#FFA5A5]/60 text-[#FF3030]",
  Aprobada: "bg-[#CCFFA5]/60 text-[#26AF00]",
  Cancelada: "bg-[#B1B1B1] text-black",
};

export const CLIENT_CATEGORY_COLORS: Record<NonNullable<CategoriaCliente>, string> = {
  Black: "bg-black text-white",
  Silver: "text-[#1e1e1e] bg-[#e0e0e0]/60",
  Gold: "text-yellow-700 bg-[#f4d966]/60",
  Emprendedor: "text-lime-700 bg-[#acf466]/60",
  Baneado: "text-[#ffffff] bg-[#ff0000]/60",
};

export const USERS: Record<ActorTipo, string> = {
  Cliente: "bg-blue-50 text-blue-700",
  Direccion: "bg-amber-50 text-amber-700",
};

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
  nombre_servicio: string;
  nombre_material: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  // VariablesCotizacion entries linked to this detalle, resolved to the
  // FormulaVariable shape so the table can render their pills inline.
  variables: FormulaVariable[];
  // ArchivosDisenio attached to this detalle. Optional because legacy
  // detalles created before the placeholder upload existed could be null
  // (Prisma model guarantees the relation, but defensive on the client).
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
    };
    usuario: { nombre_completo: string } | null;
  }[];

  rechazada: { fecha_rechazo: string } | null;
}

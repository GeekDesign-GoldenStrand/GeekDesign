import { z } from "zod";

import { isValidKey } from "@/lib/storage/keys";

export const CreateCotizacionSchema = z.object({
  id_pedido: z.number().int().positive().optional(),
  id_cliente: z.number().int().positive(),
  id_estatus_cotizacion: z.number().int().positive().optional(),
  folio: z.string().max(50).optional(),
  monto_total: z.number().nonnegative(),
  empresa_cliente: z.string().max(100).optional(),
  fecha_fin: z.coerce.date().optional(),
  pdf_url: z.string().url().max(500).optional(),
  notas: z.string().optional(),
});

export const UpdateCotizacionSchema = z.object({
  // Existing fields
  id_estatus_cotizacion: z.number().int().positive().optional(),
  monto_total: z.number().nonnegative().optional(),
  empresa_cliente: z.string().max(100).optional(),
  fecha_fin: z.coerce.date().optional(),
  fecha_validacion: z.coerce.date().optional(),
  fecha_aprobacion: z.coerce.date().optional(),
  pdf_url: z.string().url().max(500).optional(),
  notas: z.string().optional(),

  // Added for EditarCotizacion
  id_cliente: z.number().int().positive().optional(),
  nombre_oportunidad: z.string().max(255).optional(),

  // Inline DetallePedido edits — cantidad + precio_unitario per line item.
  // subtotal is recomputed server-side; the client never sends it.
  servicios: z
    .array(
      z.object({
        id_detalle: z.number().int().positive(),
        cantidad: z.number().int().positive(),
        precio_unitario: z.number().nonnegative(),
      })
    )
    .optional(),
});

export const CotizacionIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

// ─────────────────────────────────────────────
// Discount rules — single source of truth shared by the API (this Zod
// schema) and the front-end modal (AplicarDescuento). Edit one place
// and both the client-side validation messages and the server-side
// guard move in lockstep.
// ─────────────────────────────────────────────
export const DISCOUNT_MIN = 5;
export const DISCOUNT_MAX = 20;
export const DISCOUNT_STEP = 5;

// Validation message catalog — kept here so the front-end can show the
// exact same copy the server would reject with. Keys match the alts in
// the COT-06 sequence diagram.
export const DISCOUNT_ERROR = {
  NOT_INTEGER: "Ingresa un número entero",
  ZERO: "El descuento debe ser mayor o igual a 5%",
  TOO_LOW: `El descuento debe ser de al menos ${DISCOUNT_MIN}%`,
  TOO_HIGH: `El descuento no puede superar el ${DISCOUNT_MAX}%`,
  NOT_MULTIPLE: `El descuento debe ser múltiplo de ${DISCOUNT_STEP}, mínimo ${DISCOUNT_MIN}%`,
} as const;

// Returns the first applicable error string for a percentage, or null
// when the value is acceptable. Used directly by the modal and mirrored
// by the Zod schema below so both layers reject the same set of inputs
// with the same messaging.
export function validateDescuentoPercentage(value: number): string | null {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return DISCOUNT_ERROR.NOT_INTEGER;
  }
  if (value === 0) {
    return DISCOUNT_ERROR.ZERO;
  }
  if (value > DISCOUNT_MAX) {
    return DISCOUNT_ERROR.TOO_HIGH;
  }
  if (value < DISCOUNT_MIN || value % DISCOUNT_STEP !== 0) {
    return DISCOUNT_ERROR.NOT_MULTIPLE;
  }
  return null;
}

export const AplicarDescuentoSchema = z.object({
  porcentaje_descuento: z
    .number()
    .int(DISCOUNT_ERROR.NOT_INTEGER)
    .min(DISCOUNT_MIN, DISCOUNT_ERROR.TOO_LOW)
    .max(DISCOUNT_MAX, DISCOUNT_ERROR.TOO_HIGH)
    .refine((v) => v % DISCOUNT_STEP === 0, DISCOUNT_ERROR.NOT_MULTIPLE)
    .nullable(),
  motivo_descuento: z.string().max(255).nullable().optional(),
});

// ST-23: cliente envía el carrito desde el storefront público.
// El servidor recomputa precios (no confía en el monto enviado por el cliente)
// y crea Cotización + Pedido draft + DetallePedido[] + VariablesCotizacion[] en
// una sola transacción.
const SolicitarItemSchema = z.object({
  id_servicio: z.number().int().positive(),
  id_material: z.number().int().positive(),
  cantidad: z.number().int().positive().max(9999),
  notas: z.string().max(500).optional(),
  // Storage key of the design file the client uploaded before adding to cart.
  // Presence is optional — items without a design file fall back to the
  // placeholder ArchivosDisenio row so DetallePedido.id_archivo stays NOT NULL.
  // Must be a valid key in the "disenios" category (format: disenios/yyyy/mm/<uuid>.<ext>).
  disenio_key: z
    .string()
    .max(500)
    .refine((k) => isValidKey(k, "disenios"), {
      message: "disenio_key must be a valid disenios storage key",
    })
    .optional(),
  // Original filename supplied by the client (e.g. "logo_cliente.ai").
  // Stored as ArchivosDisenio.nombre_archivo so admins see a human-readable name.
  disenio_nombre: z.string().min(1).max(255).optional(),
  variables: z
    .array(
      z.object({
        nombre_variable: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-zA-Z0-9_]+$/, "Identificador inválido"),
        // Must mirror CalcularPrecioSchema in lib/schemas/servicios.ts:
        // physical magnitudes are strictly positive with a typo-safety upper bound.
        valor: z
          .number()
          .positive("El valor debe ser mayor que 0")
          .lte(100000, "Valor demasiado grande"),
      })
    )
    .default([]),
});

const SolicitarClienteSchema = z.object({
  nombre_cliente: z.string().min(1).max(100),
  empresa: z.string().max(100).optional(),
  correo_electronico: z.string().email().max(150),
  numero_telefono: z.string().min(1).max(20),
});

export const SolicitarCotizacionSchema = z.object({
  cliente: SolicitarClienteSchema,
  id_sucursal: z.number().int().positive(),
  notas: z
    .string()
    .max(500, "Las notas no pueden superar los 500 caracteres")
    .regex(
      /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s.,;:!?¿¡'"\(\)\-\[\]\{\}/&%$€£¥*+=@_#\\|<>^~`´]*$/,
      "Las notas solo pueden contener letras en inglés o español, números y signos de puntuación comunes, y no se permiten emojis"
    )
    .optional(),
  fecha_estimada: z.coerce
    .date()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Subtract 24 hours to accommodate timezone differences
      const limit = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return val >= limit;
    }, "La fecha estimada no puede ser anterior a la fecha actual")
    .refine((val) => {
      if (!val) return true;
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);
      maxDate.setHours(23, 59, 59, 999);
      // Add 24 hours to accommodate timezone differences
      const limit = new Date(maxDate.getTime() + 24 * 60 * 60 * 1000);
      return val <= limit;
    }, "La fecha estimada no puede superar los 2 años a partir de hoy"),
  items: z.array(SolicitarItemSchema).min(1, "El carrito está vacío"),
});

export type CreateCotizacionInput = z.infer<typeof CreateCotizacionSchema>;
export type UpdateCotizacionInput = z.infer<typeof UpdateCotizacionSchema>;
export type SolicitarCotizacionInput = z.infer<typeof SolicitarCotizacionSchema>;
export type AplicarDescuentoInput = z.infer<typeof AplicarDescuentoSchema>;

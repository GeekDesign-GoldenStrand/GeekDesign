import { z } from "zod";

import { isValidKey } from "@/lib/storage/keys";
import { emailField } from "@/lib/utils/email";

import { noEmoji, textOnly } from "./text-validation";

export const CreateCotizacionSchema = z.object({
  id_pedido: z.number().int().positive().optional(),
  id_cliente: z.number().int().positive(),
  id_estatus_cotizacion: z.number().int().positive().optional(),
  folio: z.string().max(50).optional(),
  monto_total: z.number().nonnegative(),
  empresa_cliente: z
    .string()
    .max(100)
    .optional()
    .refine((v) => (v ? noEmoji(v) : true), { message: "La empresa no debe contener emojis" })
    .refine((v) => (v ? textOnly(v) : true), {
      message: "La empresa solo debe contener caracteres en inglés o español y signos comunes",
    }),
  fecha_fin: z.coerce.date().optional(),
  pdf_url: z.string().url().max(500).optional(),
  notas: z
    .string()
    .optional()
    .refine((v) => (v ? noEmoji(v) : true), { message: "Las notas no deben contener emojis" })
    .refine((v) => (v ? textOnly(v) : true), {
      message: "Las notas solo deben contener caracteres en inglés o español y signos comunes",
    }),
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
        // Mirror SolicitarItemSchema's cap (storefront uses .max(1000) on the
        // same field). Safe to apply on the edit path too because cantidad
        // has always been enforced at creation, so no legacy line item can
        // exceed it.
        cantidad: z.number().int().positive().max(1000, "La cantidad no puede superar 1000"),
        // Tight upper bound so cantidad * precio_unitario always fits in the
        // DB column type. monto_total / precio_unitario / subtotal are all
        // Decimal(10,2) → max 99,999,999.99. With cantidad capped at 1000,
        // a precio cap of 99,999.99 keeps subtotal at 99,999,990.00 — safely
        // inside the column. Without this guard a large precio would surface
        // as a Postgres "numeric field overflow" → 500.
        precio_unitario: z
          .number()
          .nonnegative()
          .max(99999.99, "El precio unitario no puede superar 99,999.99"),
      })
    )
    .optional(),
});

export const CotizacionIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

// ─────────────────────────────────────────────
// Discount / surcharge rules — single source of truth shared by the API
// (this Zod schema) and the front-end modal (AplicarDescuento).
//
// Range is symmetric around zero: positive values are discounts (reduce
// the total), negative values are surcharges/interest applied when the
// client opts to pay en plazos. Any integer in [DISCOUNT_MIN, DISCOUNT_MAX]
// is valid — there is no step constraint.
// ─────────────────────────────────────────────
export const DISCOUNT_MIN = -20;
export const DISCOUNT_MAX = 20;

export const DISCOUNT_ERROR = {
  NOT_INTEGER: "Ingresa un número entero",
  ZERO: "Para no aplicar ajuste, elimina el actual en lugar de usar 0%",
  TOO_LOW: `El valor no puede ser menor a ${DISCOUNT_MIN}%`,
  TOO_HIGH: `El valor no puede superar ${DISCOUNT_MAX}%`,
} as const;

// Returns the first applicable error string for a percentage, or null
// when the value is acceptable. Used directly by the modal and mirrored
// by the Zod schema below so both layers reject the same set of inputs
// with the same messaging. 0 is rejected because the null path (remove
// adjustment) covers the "no change" intent unambiguously.
export function validateDescuentoPercentage(value: number): string | null {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return DISCOUNT_ERROR.NOT_INTEGER;
  }
  if (value === 0) {
    return DISCOUNT_ERROR.ZERO;
  }
  if (value < DISCOUNT_MIN) {
    return DISCOUNT_ERROR.TOO_LOW;
  }
  if (value > DISCOUNT_MAX) {
    return DISCOUNT_ERROR.TOO_HIGH;
  }
  return null;
}

export const AplicarDescuentoSchema = z.object({
  porcentaje_descuento: z
    .number()
    .int(DISCOUNT_ERROR.NOT_INTEGER)
    .min(DISCOUNT_MIN, DISCOUNT_ERROR.TOO_LOW)
    .max(DISCOUNT_MAX, DISCOUNT_ERROR.TOO_HIGH)
    .refine((v) => v !== 0, DISCOUNT_ERROR.ZERO)
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
  cantidad: z.number().int().positive().max(1000),
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
  correo_electronico: emailField({ max: 150 }),
  numero_telefono: z.string().min(1).max(20),
});

const DatosFacturacionSchema = z.object({
  rfc: z.string().min(12).max(13),
  razon_social: z.string().min(1).max(254),
  tipo_persona: z.enum(["Fisica", "Moral"]),
  regimen_fiscal: z.string().min(1).max(100),
  uso_cfdi: z.string().min(1).max(100),
  codigo_postal_fiscal: z.string().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
  correo_facturacion: z.string().email().max(150).optional(),
});

export const SolicitarCotizacionSchema = z.object({
  cliente: SolicitarClienteSchema,
  id_sucursal: z.number().int().positive(),
  factura: z.boolean().optional(),
  datos_facturacion: DatosFacturacionSchema.optional(),
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
    .refine((val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Subtract 24 hours to accommodate timezone differences
      const limit = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return val >= limit;
    }, "La fecha estimada no puede ser anterior a la fecha actual")
    .refine((val) => {
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

import { z } from "zod";

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

export const AplicarDescuentoSchema = z.object({
  porcentaje_descuento: z
    .number()
    .int("Ingresa un número entero")
    .min(5, "El descuento debe ser de al menos 5%")
    .max(20, "El descuento no puede superar el 20%")
    .refine((v) => v % 5 === 0, "El descuento debe ser múltiplo de 5")
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
  variables: z
    .array(
      z.object({
        // Copilot review #6: align identifier validation with CalcularPrecioSchema.
        nombre_variable: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-zA-Z0-9_]+$/, "Identificador inválido"),
        valor: z.number().finite(),
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
  notas: z.string().max(2000).optional(),
  items: z.array(SolicitarItemSchema).min(1, "El carrito está vacío"),
});

export type CreateCotizacionInput = z.infer<typeof CreateCotizacionSchema>;
export type UpdateCotizacionInput = z.infer<typeof UpdateCotizacionSchema>;
export type SolicitarCotizacionInput = z.infer<typeof SolicitarCotizacionSchema>;
export type AplicarDescuentoInput = z.infer<typeof AplicarDescuentoSchema>;

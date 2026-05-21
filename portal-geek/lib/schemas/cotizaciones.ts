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
  id_estatus_cotizacion: z.number().int().positive().optional(),
  monto_total: z.number().nonnegative().optional(),
  empresa_cliente: z.string().max(100).optional(),
  fecha_fin: z.coerce.date().optional(),
  fecha_validacion: z.coerce.date().optional(),
  fecha_aprobacion: z.coerce.date().optional(),
  pdf_url: z.string().url().max(500).optional(),
  notas: z.string().optional(),
});

export const CotizacionIdParams = z.object({
  id: z.coerce.number().int().positive(),
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

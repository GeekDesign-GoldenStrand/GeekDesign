import { z } from "zod";

export const CreateCotizacionSchema = z.object({
  id_pedido: z.number().int().positive().optional(),
  id_cliente: z.number().int().positive(),
  id_estatus_cotizacion: z.number().int().positive(),
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

export type CreateCotizacionInput = z.infer<typeof CreateCotizacionSchema>;
export type UpdateCotizacionInput = z.infer<typeof UpdateCotizacionSchema>;

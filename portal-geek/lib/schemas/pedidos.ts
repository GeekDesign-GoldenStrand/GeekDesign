import { z } from "zod";

export const CreatePedidoSchema = z.object({
  id_cliente: z.number().int().positive(),
  id_estatus: z.number().int().positive(),
  id_sucursal: z.number().int().positive().optional(),
  fecha_estimada: z.coerce.date().optional(),
  factura: z.boolean().default(false),
  notas: z.string().optional(),
});

export const UpdatePedidoSchema = z.object({
  id_estatus: z.number().int().positive().optional(),
  id_sucursal: z.number().int().positive().optional(),
  fecha_estimada: z.coerce.date().optional(),
  fecha_fin: z.coerce.date().optional(),
  factura: z.boolean().optional(),
  facturado: z.boolean().optional(),
  numero_factura: z.string().max(100).optional(),
  notas: z.string().optional(),
});

export const PedidoIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreatePedidoInput = z.infer<typeof CreatePedidoSchema>;
export type UpdatePedidoInput = z.infer<typeof UpdatePedidoSchema>;

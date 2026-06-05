import { z } from "zod";

import { noEmoji, textOnly } from "./text-validation";

export const CreatePedidoSchema = z.object({
  id_cliente: z.number().int().positive(),
  id_estatus: z.number().int().positive(),
  id_sucursal: z.number().int().positive().optional(),
  fecha_estimada: z.coerce.date().optional(),
  notas: z
    .string()
    .optional()
    .refine((v) => (v ? noEmoji(v) : true), { message: "Las notas no deben contener emojis" })
    .refine((v) => (v ? textOnly(v) : true), {
      message: "Las notas solo deben contener caracteres en inglés o español y signos comunes",
    }),
});

export const UpdatePedidoSchema = z.object({
  id_estatus: z.number().int().positive().optional(),
  id_sucursal: z.number().int().positive().optional(),
  fecha_estimada: z.coerce.date().optional(),
  fecha_fin: z.coerce.date().optional(),
  facturado: z.boolean().optional(),
  numero_factura: z.string().max(100).optional(),
  notas: z
    .string()
    .optional()
    .refine((v) => (v ? noEmoji(v) : true), { message: "Las notas no deben contener emojis" })
    .refine((v) => (v ? textOnly(v) : true), {
      message: "Las notas solo deben contener caracteres en inglés o español y signos comunes",
    }),
});

export const PedidoIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreatePedidoInput = z.infer<typeof CreatePedidoSchema>;
export type UpdatePedidoInput = z.infer<typeof UpdatePedidoSchema>;

export const DetallePedidoIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

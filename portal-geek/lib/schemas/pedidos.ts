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

// T1: status, sucursal-reassignment, and invoicing fields are deliberately
// absent. Each has its own write path so the audit trail and role gates can't
// be bypassed by sending them through the generic update endpoint:
//   - id_estatus           → PATCH /api/pedidos/[id]/estatus (logged in
//                            HistorialEstadosPedidos with the actor)
//   - facturado / numero_factura → Finanzas-only invoicing endpoint (TBD)
//   - id_sucursal          → branch reassignment, no flow exists yet
// Adding any of these back here would silently re-open the mass-assignment
// vector at PUT /api/pedidos/[id] for every role with `pedidos:write`.
export const UpdatePedidoSchema = z.object({
  fecha_estimada: z.coerce.date().optional(),
  fecha_fin: z.coerce.date().optional(),
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

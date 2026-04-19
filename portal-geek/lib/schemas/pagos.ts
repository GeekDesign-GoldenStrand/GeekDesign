import { z } from "zod";

export const CreatePagoSchema = z.object({
  id_pedido: z.number().int().positive(),
  monto_pago: z.number().positive(),
  metodo_pago: z.enum(["efectivo", "transferencia", "Mercado Pago"]),
  referencia_mercadopago: z.string().max(255).optional(),
  estatus_pago: z.enum(["Pendiente", "Pagado", "Reembolsado"]).default("Pendiente"),
});

export const UpdatePagoSchema = z.object({
  estatus_pago: z.enum(["Pendiente", "Pagado", "Reembolsado"]).optional(),
  referencia_mercadopago: z.string().max(255).optional(),
});

export const PagoIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreatePagoInput = z.infer<typeof CreatePagoSchema>;
export type UpdatePagoInput = z.infer<typeof UpdatePagoSchema>;

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

// ST-17 §0 — Dirección fija el anticipo de un pedido. Permite 0 para "sin
// anticipo" (el cliente pagará el total de una sola vez).
export const SetAnticipoSchema = z.object({
  monto_anticipo: z.number().nonnegative(),
});

// ST-17 §2 — el storefront solicita crear la preferencia de pago para un folio.
export const PreferenciaInputSchema = z.object({
  folio: z.string().trim().min(1).max(50),
});

// ST-17 §1 — consulta del saldo por folio (query param).
export const SaldoQuerySchema = z.object({
  folio: z.string().trim().min(1).max(50),
});

export type CreatePagoInput = z.infer<typeof CreatePagoSchema>;
export type UpdatePagoInput = z.infer<typeof UpdatePagoSchema>;
export type SetAnticipoInput = z.infer<typeof SetAnticipoSchema>;
export type PreferenciaInput = z.infer<typeof PreferenciaInputSchema>;

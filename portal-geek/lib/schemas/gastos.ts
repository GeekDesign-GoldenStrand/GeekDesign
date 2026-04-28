import { z } from "zod";

export const CreateGastoSchema = z.object({
  id_pedido: z.number().int().positive(),
  tipo_costo: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  id_proveedor: z.number().int().positive().optional(),
  monto: z.number().positive(),
  descripcion: z.string().optional(),
});

export const UpdateGastoSchema = CreateGastoSchema.partial();

export const GastoIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateGastoInput = z.infer<typeof CreateGastoSchema>;
export type UpdateGastoInput = z.infer<typeof UpdateGastoSchema>;

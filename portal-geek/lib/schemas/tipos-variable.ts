import { z } from "zod";

export const CreateTipoVariableSchema = z.object({
  nombre_tipo: z.string().min(1).max(50),
  unidad_default: z.string().max(20).optional(),
  descripcion: z.string().optional(),
  estatus: z.string().default("Activo"),
});

export const UpdateTipoVariableSchema = CreateTipoVariableSchema.partial();

export const TipoVariableIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateTipoVariableInput = z.infer<typeof CreateTipoVariableSchema>;
export type UpdateTipoVariableInput = z.infer<typeof UpdateTipoVariableSchema>;

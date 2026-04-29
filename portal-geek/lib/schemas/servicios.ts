import { z } from "zod";

export const CreateServicioSchema = z.object({
  id_estatus: z.number().int().positive(),
  nombre_servicio: z.string().min(1).max(100),
  descripcion_servicio: z.string().optional(),
  estatus_servicio: z.boolean().default(true),
});

export const UpdateServicioSchema = CreateServicioSchema.partial();

export const ServicioIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateServicioInput = z.infer<typeof CreateServicioSchema>;
export type UpdateServicioInput = z.infer<typeof UpdateServicioSchema>;

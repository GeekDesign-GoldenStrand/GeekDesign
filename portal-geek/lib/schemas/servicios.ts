import { z } from "zod";

export const CreateServicioSchema = z.object({
  id_estatus: z.number().int().positive(),
  nombre_servicio: z.string().min(1).max(100),
  descripcion_servicio: z.string().optional(),
  estatus_servicio: z.boolean().default(true),


  // Array for entities to vinculate with this service
  id_maquinas: z.array(z.number().int().positive()).optional().default([]),
  id_instaladores: z.array(z.number().int().positive()).optional().default([]),
  id_proveedores: z.array(z.number().int().positive()).optional().default([]),
});

export const UpdateServicioSchema = CreateServicioSchema.partial();

export const ServicioIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateServicioInput = z.infer<typeof CreateServicioSchema>;
export type UpdateServicioInput = z.infer<typeof UpdateServicioSchema>;

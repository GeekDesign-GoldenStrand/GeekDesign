import { z } from "zod";

export const CreateMaterialSchema = z.object({
  nombre_material: z.string().min(1).max(100),
  descripcion_material: z.string().optional(),
  unidad_medida: z.string().min(1).max(30),
  ancho: z.number().positive().optional(),
  alto: z.number().positive().optional(),
  grosor: z.number().positive().optional(),
  color: z.string().max(50).optional(),
  imagen_url: z.string().url().max(500).optional(),
});

export const UpdateMaterialSchema = CreateMaterialSchema.partial();

export const MaterialIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>;

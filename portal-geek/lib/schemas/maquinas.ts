import { z } from "zod";

export const CreateMaquinaSchema = z.object({
  nombre_maquina: z.string().min(1).max(100),
  apodo_maquina: z.string().min(1).max(100),
  tipo: z.enum(["Láser CO2", "Láser Fibra", "Bordadora"]),
  descripcion: z.string().optional(),
  estatus: z.enum(["Activa", "Inactiva", "En mantenimiento"]).default("Activa"),
});

export const UpdateMaquinaSchema = CreateMaquinaSchema.partial();

export const MaquinaIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateMaquinaInput = z.infer<typeof CreateMaquinaSchema>;
export type UpdateMaquinaInput = z.infer<typeof UpdateMaquinaSchema>;

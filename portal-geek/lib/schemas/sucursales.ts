import { z } from "zod";

export const CreateSucursalSchema = z.object({
  nombre_sucursal: z.string().min(1).max(100),
  direccion: z.string().min(1).max(255),
  horario_apertura: z.coerce.date().optional(),
  horario_salida: z.coerce.date().optional(),
  estatus: z.enum(["Activo", "Inactivo"]).default("Activo"),
});

export const UpdateSucursalSchema = CreateSucursalSchema.partial();

export const SucursalIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateSucursalInput = z.infer<typeof CreateSucursalSchema>;
export type UpdateSucursalInput = z.infer<typeof UpdateSucursalSchema>;

import { z } from "zod";

export const CreateColaboradorSchema = z.object({
  nombre_completo: z.string().min(1).max(100),
  correo_electronico: z.email().max(150),
  contrasena_hash: z.string().min(8),
  id_rol: z.number().int().positive(),
  id_sucursal: z.number().int().positive(),
  edad: z.number().int().min(16).max(100),
  sexo: z.enum(["M", "F", "NA"]),
  telefono: z.string().min(1).max(20),
  estatus: z.enum(["Activo", "Inactivo"]).default("Activo"),
  estatus_colaborador: z.enum(["Activo", "Inactivo"]).default("Activo"),
});

export const UpdateColaboradorSchema = CreateColaboradorSchema.partial();

export const ColaboradorIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateColaboradorInput = z.infer<typeof CreateColaboradorSchema>;
export type UpdateColaboradorInput = z.infer<typeof UpdateColaboradorSchema>;

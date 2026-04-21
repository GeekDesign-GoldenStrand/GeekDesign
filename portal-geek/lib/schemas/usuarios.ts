import { z } from "zod";

export const CreateUsuarioSchema = z.object({
  nombre_completo: z.string().min(1).max(100),
  correo_electronico: z.string().email().max(150),
  contrasena: z.string().min(8),
  id_rol: z.number().int().positive(),
  estatus: z.enum(["Activo", "Inactivo"]).default("Activo"),
});

export const UpdateUsuarioSchema = z.object({
  nombre_completo: z.string().min(1).max(100).optional(),
  correo_electronico: z.string().email().max(150).optional(),
  id_rol: z.number().int().positive().optional(),
  estatus: z.enum(["Activo", "Inactivo"]).optional(),
});

export const UsuarioIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateUsuarioInput = z.infer<typeof CreateUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof UpdateUsuarioSchema>;

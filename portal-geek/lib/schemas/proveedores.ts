import { z } from "zod";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.\-' ]+$/;

export const CreateProveedorSchema = z.object({
  nombre_proveedor: z
    .string()
    .min(1)
    .max(30, "Máximo 30 caracteres.")
    .regex(NOMBRE_REGEX, "Solo letras, números, puntos, guiones y apóstrofes."),
  apodo: z
    .string()
    .max(30, "Máximo 30 caracteres.")
    .regex(NOMBRE_REGEX, "Solo letras, números, puntos, guiones y apóstrofes.")
    .optional(),
  tipo: z.string(),
  telefono: z
    .string()
    .refine((v) => !v || /^\d{10}$/.test(v), "Debe tener exactamente 10 dígitos.")
    .optional(),
  correo: z.email().max(150),
  descripcion_proveedor: z.string().optional(),
  ubicacion: z.string().max(255).optional(),
  estatus: z.enum(["Activo", "Inactivo", "Baneado"]).default("Activo"),
});

export const UpdateProveedorSchema = CreateProveedorSchema.partial();

export const ProveedorIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateProveedorInput = z.infer<typeof CreateProveedorSchema>;
export type UpdateProveedorInput = z.infer<typeof UpdateProveedorSchema>;

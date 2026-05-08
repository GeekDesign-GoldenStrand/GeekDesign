import { z } from "zod";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.,\-' ]+$/;

export const CreateInstaladorSchema = z.object({
  nombre_instalador: z
    .string()
    .min(1)
    .max(30, "Máximo 30 caracteres.")
    .regex(NOMBRE_REGEX, "Solo letras, números, puntos, guiones y apóstrofes."),
  apodo: z
    .string()
    .max(30, "Máximo 30 caracteres.")
    .regex(NOMBRE_REGEX, "Solo letras, números, puntos, guiones y apóstrofes.")
    .optional(),
  tipo: z.enum(["Instalador", "Contratista"]),
  telefono: z
    .string()
    .min(1, "El teléfono es requerido.")
    .regex(/^\d{10}$/, "Debe tener exactamente 10 dígitos."),
  correo: z.email("Correo electrónico inválido.").max(150),
  notas: z.string().max(500).optional(),
  ubicacion: z.string().max(255).optional(),
  estatus: z.enum(["Activo", "Inactivo", "Baneado"]).default("Activo"),
});

export const UpdateInstaladorSchema = CreateInstaladorSchema.partial();

export const InstaladorIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateInstaladorInput = z.infer<typeof CreateInstaladorSchema>;
export type UpdateInstaladorInput = z.infer<typeof UpdateInstaladorSchema>;

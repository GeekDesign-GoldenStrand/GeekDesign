import { z } from "zod";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.,\-' ]+$/;
// "Municipio, Estado": letters/accents/spaces on each side of a single comma. No
// digits, emojis or symbols — those passed the old single-comma check.
export const UBICACION_REGEX = /^[a-zA-ZÀ-ÿ.\-' ]+,\s*[a-zA-ZÀ-ÿ.\-' ]+$/;

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
  tipo: z.string().refine((val) => {
    const validTipos = ["Proveedor de material", "Proveedor de servicio"];
    const parts = val.split(",").map((p) => p.trim());
    return parts.length > 0 && parts.every((p) => validTipos.includes(p));
  }, "Tipo inválido. Valores aceptados: Proveedor de material, Proveedor de servicio."),
  telefono: z
    .string()
    .min(1, "El teléfono es requerido.")
    .regex(/^\d{10}$/, "Debe tener exactamente 10 dígitos."),
  correo: z.email("Correo electrónico inválido.").max(150),
  descripcion_proveedor: z.string().max(500, "Máximo 500 caracteres.").optional(),
  ubicacion: z
    .string()
    .max(255)
    .refine((v) => !v || UBICACION_REGEX.test(v.trim()), "Formato requerido: Municipio, Estado")
    .optional(),
  estatus: z.enum(["Activo", "Inactivo", "Baneado"]).default("Activo"),
  color: z.string().min(1, "El color es requerido.").max(50),
});

export const UpdateProveedorSchema = CreateProveedorSchema.partial();

export const ProveedorIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateProveedorInput = z.infer<typeof CreateProveedorSchema>;
export type UpdateProveedorInput = z.infer<typeof UpdateProveedorSchema>;

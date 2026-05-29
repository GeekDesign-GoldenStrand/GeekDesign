import { z } from "zod";

import { noEmoji, textOnly, addressOnly } from "./text-validation";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.,\-' ]+$/;
// Accepts English and Spanish characters, numbers, spaces, and common address punctuation.
export const UBICACION_REGEX = /^[a-zA-ZÀ-ÿ0-9.,\-'#°/()\s_&@:;\"]*$/;

export const CreateProveedorSchema = z.object({
  nombre_proveedor: z
    .string()
    .min(1)
    .max(30, "Máximo 30 caracteres.")
    .regex(NOMBRE_REGEX, "Solo letras, números, puntos, guiones y apóstrofes.")
    .refine(noEmoji, { message: "El nombre no debe contener emojis" })
    .refine(textOnly, {
      message: "El nombre solo debe contener caracteres en inglés o español y signos comunes",
    }),
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
    .max(100, "Máximo 100 caracteres.")
    .optional()
    .refine((v) => (v ? addressOnly(v.trim()) : true), {
      message: "La ubicación contiene caracteres inválidos",
    }),
  estatus: z.enum(["Activo", "Inactivo", "Baneado"]).default("Activo"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "El color debe ser un HEX válido (ej. #3B82F6)."),
});

export const UpdateProveedorSchema = CreateProveedorSchema.partial();

export const ProveedorIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateProveedorInput = z.infer<typeof CreateProveedorSchema>;
export type UpdateProveedorInput = z.infer<typeof UpdateProveedorSchema>;

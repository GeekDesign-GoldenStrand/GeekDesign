import { z } from "zod";

const NOMBRE_REGEX = /^[a-zA-ZÀ-ÿ0-9.,\-' ]+$/;

export const UNIDADES_MEDIDA = ["mm", "in", "cm", "µ", "pt"] as const;

export const CreateMaterialSchema = z.object({
  nombre_material: z
    .string()
    .min(1, "El nombre es requerido.")
    .max(100, "Máximo 100 caracteres.")
    .regex(NOMBRE_REGEX, "Solo letras, números, puntos, guiones y apóstrofes."),
  descripcion_material: z
    .string()
    .min(1, "La descripción es requerida.")
    .max(500, "Máximo 500 caracteres."),
  unidad_medida: z.enum(UNIDADES_MEDIDA, { message: "La unidad de medida es requerida." }),
  ancho: z
    .number({ message: "Campo requerido" })
    .positive("El ancho debe ser mayor a 0.")
    .refine((v) => Math.floor(Math.abs(v)).toString().length <= 10, "Máximo 10 dígitos enteros.")
    .refine((v) => (v.toString().split(".")[1] ?? "").length <= 2, "Máximo 2 decimales."),
  alto: z
    .number({ message: "Campo requerido" })
    .positive("El alto debe ser mayor a 0.")
    .refine((v) => Math.floor(Math.abs(v)).toString().length <= 10, "Máximo 10 dígitos enteros.")
    .refine((v) => (v.toString().split(".")[1] ?? "").length <= 2, "Máximo 2 decimales."),
  grosor: z
    .number({ message: "Campo requerido" })
    .positive("El grosor debe ser mayor a 0.")
    .refine((v) => Math.floor(Math.abs(v)).toString().length <= 10, "Máximo 10 dígitos enteros.")
    .refine((v) => (v.toString().split(".")[1] ?? "").length <= 2, "Máximo 2 decimales."),
  color: z.string().min(1, "El color es requerido.").max(50, "Máximo 50 caracteres."),
  imagen_url: z
    .string()
    .min(1, "La URL de imagen es requerida.")
    .url("Debe ser una URL válida.")
    .refine(
      (value) => value.toLowerCase().startsWith("https://"),
      "La URL de imagen debe iniciar con https://"
    )
    .max(500, "Máximo 500 caracteres."),
});

export const UpdateMaterialSchema = CreateMaterialSchema.partial();

export const MaterialIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>;

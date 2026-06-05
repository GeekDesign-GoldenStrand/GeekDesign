import { z } from "zod";

import { noEmoji, textOnly } from "./text-validation";

export const CreateTipoVariableSchema = z.object({
  nombre_tipo: z
    .string()
    .min(1)
    .max(50)
    .refine(noEmoji, { message: "El nombre no debe contener emojis" })
    .refine(textOnly, {
      message: "El nombre solo debe contener caracteres en inglés o español y signos comunes",
    }),
  unidad_default: z
    .string()
    .max(20)
    .optional()
    .refine((v) => (v ? noEmoji(v) : true), { message: "La unidad no debe contener emojis" }),
  descripcion: z
    .string()
    .optional()
    .refine((v) => (v ? noEmoji(v) : true), { message: "La descripción no debe contener emojis" })
    .refine((v) => (v ? textOnly(v) : true), {
      message: "La descripción solo debe contener caracteres en inglés o español y signos comunes",
    }),
  estatus: z.string().default("Activo"),
});

export const UpdateTipoVariableSchema = CreateTipoVariableSchema.partial();

export const TipoVariableIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateTipoVariableInput = z.infer<typeof CreateTipoVariableSchema>;
export type UpdateTipoVariableInput = z.infer<typeof UpdateTipoVariableSchema>;

import { z } from "zod";

import { emailField } from "@/lib/utils/email";

import { noEmoji, textOnly } from "./text-validation";

export const CreateColaboradorSchema = z.object({
  nombre_completo: z
    .string()
    .min(1)
    .max(100)
    .refine(noEmoji, { message: "El nombre no debe contener emojis" })
    .refine(textOnly, {
      message: "El nombre solo debe contener caracteres en inglés o español y signos comunes",
    }),
  correo_electronico: emailField({ max: 150 }),
  contrasena_hash: z.string().min(8).optional(),
  id_rol: z.number().int().positive(),
  id_sucursal: z.number().int().positive(),
  edad: z.number().int().min(16).max(100),
  sexo: z
    .enum(["M", "F", "NA"])
    .refine((v) => noEmoji(v), { message: "El campo sexo no debe contener emojis" })
    .refine((v) => textOnly(v), {
      message: "El campo sexo solo debe contener caracteres en inglés o español y signos comunes",
    }),
  telefono: z
    .string()
    .min(1)
    .max(20)
    .refine(noEmoji, { message: "El teléfono no debe contener emojis" })
    .refine(textOnly, {
      message: "El teléfono solo debe contener caracteres en inglés o español y signos comunes",
    }),
  estatus: z.enum(["Activo", "Inactivo"]).default("Activo"),
  estatus_colaborador: z.enum(["Activo", "Inactivo"]).default("Activo"),
});

export const UpdateColaboradorSchema = CreateColaboradorSchema.partial();

export const ColaboradorIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateColaboradorInput = z.infer<typeof CreateColaboradorSchema>;
export type UpdateColaboradorInput = z.infer<typeof UpdateColaboradorSchema>;

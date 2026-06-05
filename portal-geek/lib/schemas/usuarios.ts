import { z } from "zod";

import { emailField } from "@/lib/utils/email";

import { noEmoji, textOnly } from "./text-validation";

export const CreateUsuarioSchema = z.object({
  nombre_completo: z
    .string()
    .min(1)
    .max(100)
    .refine(noEmoji, { message: "El nombre no debe contener emojis" })
    .refine(textOnly, {
      message: "El nombre solo debe contener caracteres en inglés o español y signos comunes",
    }),
  correo_electronico: emailField({ max: 150 }),
  contrasena: z.string().min(8),
  id_rol: z.number().int().positive(),
  estatus: z.enum(["Activo", "Inactivo"]).default("Activo"),
});

export const UpdateUsuarioSchema = z.object({
  nombre_completo: z.string().min(1).max(100).optional(),
  correo_electronico: emailField({ max: 150 }).optional(),
  id_rol: z.number().int().positive().optional(),
  estatus: z.enum(["Activo", "Inactivo"]).optional(),
});

export const UsuarioIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateUsuarioInput = z.infer<typeof CreateUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof UpdateUsuarioSchema>;

import { z } from "zod";

import { noEmoji, textOnly } from "./text-validation";

export const CreateClienteSchema = z.object({
  nombre_cliente: z
    .string()
    .min(1)
    .max(100)
    .refine(noEmoji, { message: "El nombre no debe contener emojis" })
    .refine(textOnly, {
      message: "El nombre solo debe contener caracteres en inglés o español y signos comunes",
    }),
  empresa: z
    .string()
    .max(100)
    .optional()
    .refine((v) => (v ? noEmoji(v) : true), { message: "La empresa no debe contener emojis" })
    .refine((v) => (v ? textOnly(v) : true), {
      message: "La empresa solo debe contener caracteres en inglés o español y signos comunes",
    }),
  rfc: z.string().length(13).optional(),
  correo_electronico: z.string().email().max(150),
  numero_telefono: z
    .string()
    .min(1)
    .max(20)
    .refine(noEmoji, { message: "El teléfono no debe contener emojis" })
    .refine(textOnly, {
      message: "El teléfono solo debe contener caracteres en inglés o español y signos comunes",
    }),
  categoria: z.enum(["Black", "Silver", "Gold", "Emprendedor", "Baneado"]).optional(),
});

export const UpdateClienteSchema = CreateClienteSchema.partial();

export const ClienteIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateClienteInput = z.infer<typeof CreateClienteSchema>;
export type UpdateClienteInput = z.infer<typeof UpdateClienteSchema>;

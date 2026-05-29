import { z } from "zod";

import { noEmoji, textOnly } from "./text-validation";

export const CreateMaquinaSchema = z.object({
  nombre_maquina: z
    .string()
    .min(1)
    .max(100)
    .refine(noEmoji, { message: "El nombre no debe contener emojis" })
    .refine(textOnly, {
      message: "El nombre solo debe contener caracteres en inglés o español y signos comunes",
    }),
  apodo_maquina: z
    .string()
    .min(1)
    .max(100)
    .refine(noEmoji, { message: "El apodo no debe contener emojis" })
    .refine(textOnly, {
      message: "El apodo solo debe contener caracteres en inglés o español y signos comunes",
    }),
  tipo: z.enum(["Láser CO2", "Láser Fibra", "Bordadora"]),
  descripcion: z.string().max(200).refine(noEmoji.check, noEmoji.message).optional(),
  estatus: z.enum(["Activa", "Inactiva", "En mantenimiento"]).default("Activa"),
});

export const UpdateMaquinaSchema = CreateMaquinaSchema.partial();

export const AsignarSucursalSchema = z.object({
  sucursal: z.number().int().positive(),
});

export const AsignarServiciosSchema = z.object({
  servicios: z.array(z.number().int().positive()),
});

export const MaquinaIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type AsignarSucursalInput = z.infer<typeof AsignarSucursalSchema>;
export type AsignarServiciosInput = z.infer<typeof AsignarServiciosSchema>;
export type CreateMaquinaInput = z.infer<typeof CreateMaquinaSchema>;
export type UpdateMaquinaInput = z.infer<typeof UpdateMaquinaSchema>;

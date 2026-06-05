import { z } from "zod";

import { noEmoji, textOnly } from "./text-validation";

const machineText = (field: string, max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine(noEmoji, { message: `${field} no debe contener emojis` })
    .refine(textOnly, {
      message: `${field} solo debe contener caracteres en inglés o español y signos comunes`,
    });

const optionalMachineText = (field: string, max: number) =>
  z
    .string()
    .max(max)
    .refine(noEmoji, { message: `${field} no debe contener emojis` })
    .refine(textOnly, {
      message: `${field} solo debe contener caracteres en inglés o español y signos comunes`,
    })
    .optional();

export const CreateMaquinaSchema = z.object({
  nombre_maquina: machineText("El nombre", 30),
  apodo_maquina: machineText("El apodo", 30),
  tipo: z.enum(["Láser CO2", "Láser Fibra", "Bordadora"]),
  descripcion: optionalMachineText("La descripción", 200),
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

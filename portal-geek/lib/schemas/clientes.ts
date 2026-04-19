import { z } from "zod";

export const CreateClienteSchema = z.object({
  nombre_cliente: z.string().min(1).max(100),
  empresa: z.string().max(100).optional(),
  rfc: z.string().length(13).optional(),
  correo_electronico: z.string().email().max(150),
  numero_telefono: z.string().min(1).max(20),
  categoria: z.enum(["Black", "Silver", "Gold", "Emprendedor", "Baneado"]).optional(),
});

export const UpdateClienteSchema = CreateClienteSchema.partial();

export const ClienteIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateClienteInput = z.infer<typeof CreateClienteSchema>;
export type UpdateClienteInput = z.infer<typeof UpdateClienteSchema>;

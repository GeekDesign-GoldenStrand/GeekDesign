import { z } from "zod";

export const CreateInstaladorSchema = z.object({
  nombre_proveedor: z.string().min(1).max(100),
  apodo: z.string().max(100).optional(),
  tipo: z.enum(["Instalador", "Contratista"]),
  telefono: z.string().max(20).optional(),
  correo: z.email().max(150).optional(),
  costo_instalacion: z.number().positive(),
  notas: z.string().max(500).optional(),
  ubicacion: z.string().max(255).optional(),
  estatus: z.enum(["Activo", "Inactivo", "Baneado"]).default("Activo"),
});

export const UpdateInstaladorSchema = CreateInstaladorSchema.partial();

export const InstaladorIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateInstaladorInput = z.infer<typeof CreateInstaladorSchema>;
export type UpdateInstaladorInput = z.infer<typeof UpdateInstaladorSchema>;

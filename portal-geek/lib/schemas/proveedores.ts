import { z } from "zod";

export const CreateProveedorSchema = z.object({
  nombre_proveedor: z.string().min(1).max(100),
  tipo: z.enum(["Proveedor de material", "Proveedor de servicio"]),
  telefono: z.string().max(20).optional(),
  correo: z.string().email().max(150).optional(),
  descripcion_proveedor: z.string().optional(),
  costo: z.number().nonnegative().optional(),
  ubicacion: z.string().max(255).optional(),
  estatus: z.enum(["Activo", "Inactivo", "Baneado"]).default("Activo"),
});

export const UpdateProveedorSchema = CreateProveedorSchema.partial();

export const ProveedorIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateProveedorInput = z.infer<typeof CreateProveedorSchema>;
export type UpdateProveedorInput = z.infer<typeof UpdateProveedorSchema>;

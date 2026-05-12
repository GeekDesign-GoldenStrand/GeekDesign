import { z } from "zod";

// Creation requires the minimum data needed to make a branch usable immediately.
// Status is required so every branch has a clear active/inactive state from the start.
export const CreateSucursalSchema = z.object({
  nombre_sucursal: z.string().min(1).max(100),
  direccion: z.string().min(1).max(255),

  // The UI sends schedule values as ISO strings.
  // Coercion keeps the API flexible while still validating them as Date values.
  horario_apertura: z.coerce.date().optional().nullable(),
  horario_salida: z.coerce.date().optional().nullable(),

  estatus: z.enum(["Activo", "Inactivo"]),
});

// Updates are partial because edit forms may send only the fields that changed.
// The schema still validates each provided field before it reaches the service layer.
export const UpdateSucursalSchema = z.object({
  nombre_sucursal: z.string().min(1).max(100).optional(),
  direccion: z.string().min(1).max(255).optional(),

  // Nullable allows clearing a schedule field without sending an invalid value.
  horario_apertura: z.coerce.date().optional().nullable(),
  horario_salida: z.coerce.date().optional().nullable(),

  estatus: z.enum(["Activo", "Inactivo"]).optional(),
});

// Route params arrive as strings in Next.js.
// Coercion converts the id safely before it is used in Prisma queries.
export const SucursalIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateSucursalInput = z.infer<typeof CreateSucursalSchema>;
export type UpdateSucursalInput = z.infer<typeof UpdateSucursalSchema>;

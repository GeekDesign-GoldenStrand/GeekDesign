import { z } from "zod";

const VariableSchema = z.object({
  id_tipo_variable: z.number().int().positive(),
  nombre_variable: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_]+$/, "Solo minúsculas, números y guiones bajos"),
  etiqueta: z.string().min(1).max(100),
  valor_default: z.string().optional(),
  editable_por_cliente: z.boolean().default(false),
  unidad: z.string().optional(),
});

const ConstanteSchema = z
  .object({
    nombre_constante: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z_][a-z0-9_]*$/, "Identificador inválido"),
    origen: z.enum(["instalador", "proveedor", "global", "manual"]),
    id_instalador: z.number().int().positive().optional(),
    id_proveedor: z.number().int().positive().optional(),
    valor: z.number().nonnegative().optional(),
    // Future-proof: when ConstantesGlobales is wired, add id_constante_global here.
  })
  .refine(
    (data) => {
      if (data.origen === "instalador") return data.id_instalador !== undefined;
      if (data.origen === "proveedor") return data.id_proveedor !== undefined;
      if (data.origen === "manual") return data.valor !== undefined && data.valor !== null;
      // 'global' constants reference ConstantesGlobales and don't require valor at creation
      return true;
    },
    {
      message:
        "El valor es requerido para constantes manuales; selecciona un instalador/proveedor o especifica un valor numérico",
    }
  );

const MaterialServicioSchema = z.object({
  id_material: z.number().int().positive(),
  id_proveedor_precio: z.number().int().positive().nullable().optional(),
});

const FormulaSchema = z.object({
  expresion: z.string().min(1).max(500),
  variables: z.array(VariableSchema).default([]),
  constantes: z.array(ConstanteSchema).default([]),
});

// ─── Main service schema ─────────────────────────────────────────────

export const CreateServicioSchema = z.object({
  id_sucursal: z.number().int().positive(),
  // id_estatus is not sent by the client; createServicio resolves the
  // "Activo" EstatusServicio server-side (see lib/services/servicios.ts).
  nombre_servicio: z.string().min(1).max(100),
  descripcion_servicio: z.string().optional(),
  estatus_servicio: z.boolean().default(true),

  // Vinculations
  id_maquinas: z.array(z.number().int().positive()).optional().default([]),
  id_instalador: z.number().int().positive().nullable().optional(),
  id_proveedor: z.number().int().positive().nullable().optional(),

  // NEW: per-service price overrides (null = use master price from Instaladores/Proveedores)
  // These allow setting a custom price for this service that overrides the default cost
  // from the linked installer or provider.
  costo_instalador_override: z.number().nonnegative().nullable().optional(),
  costo_proveedor_override: z.number().nonnegative().nullable().optional(),

  formula: FormulaSchema.optional(),
  materiales: z.array(MaterialServicioSchema).optional().default([]),
});

export const UpdateServicioSchema = CreateServicioSchema.partial();

export const ServicioIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

// Storefront request: compute the unit price of a service for the customer's
// chosen material and variable values.
export const CalcularPrecioSchema = z.object({
  id_material: z.number().int().positive(),
  variables: z
    .array(
      z.object({
        nombre_variable: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-zA-Z0-9_]+$/, "Identificador inválido"),
        valor: z.number().finite(),
      })
    )
    .default([]),
});

export type CreateServicioInput = z.infer<typeof CreateServicioSchema>;
export type UpdateServicioInput = z.infer<typeof UpdateServicioSchema>;
export type CalcularPrecioInput = z.infer<typeof CalcularPrecioSchema>;

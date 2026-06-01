import { z } from "zod";

import { isValidKey } from "@/lib/storage/keys";
import { RESERVED_IDENTIFIERS } from "@/lib/utils/formula-evaluator";

import { noEmoji, textOnly } from "./text-validation";

const reservedNameMessage = `Identificador reservado. No puede usarse: ${RESERVED_IDENTIFIERS.join(", ")}`;
const isReservedIdentifier = (n: string) => (RESERVED_IDENTIFIERS as readonly string[]).includes(n);

const VariableSchema = z.object({
  id_tipo_variable: z.number().int().positive(),
  nombre_variable: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z_][a-z0-9_]*$/, "Identificador inválido")
    .refine((n) => !isReservedIdentifier(n), { message: reservedNameMessage }),
  etiqueta: z
    .string()
    .min(1)
    .max(30)
    .refine(noEmoji, { message: "La etiqueta no debe contener emojis" })
    .refine(textOnly, {
      message: "La etiqueta solo debe contener caracteres en inglés o español y signos comunes",
    }),
  valor_default: z.coerce.number().nonnegative().max(99999999).optional(),
  editable_por_cliente: z.boolean().default(false),
  // unidad may include special characters like cm²; only block emojis here
  unidad: z
    .string()
    .max(20)
    .optional()
    .refine((v) => (v ? noEmoji(v) : true), {
      message: "La unidad no debe contener emojis",
    }),
});

const ConstanteSchema = z
  .object({
    nombre_constante: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z_][a-z0-9_]*$/, "Identificador inválido")
      .refine((n) => !isReservedIdentifier(n), { message: reservedNameMessage }),
    origen: z.enum(["instalador", "proveedor", "global", "manual"]),
    id_instalador: z.number().int().positive().optional(),
    id_proveedor: z.number().int().positive().optional(),
    valor: z.number().nonnegative().max(99999999).optional(),
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
  apodo_servicio: z.string().trim().min(1).max(100),
  descripcion_servicio: z.string().min(1).max(350).optional(),
  estatus_servicio: z.boolean().default(true),
  imagenes: z
    .array(
      z.string().refine((k) => isValidKey(k, "servicios"), {
        message: "Llave de imagen de servicio inválida",
      })
    )
    .max(5)
    .optional()
    .default([]),

  // Vinculations
  id_maquinas: z.array(z.number().int().positive()).optional().default([]),
  id_instalador: z.number().int().positive().nullable().optional(),
  id_proveedor: z.number().int().positive().nullable().optional(),

  // NEW: per-service price overrides (null = use master price from Instaladores/Proveedores)
  // These allow setting a custom price for this service that overrides the default cost
  // from the linked installer or provider. Upper bound mirrors the UI input cap in
  // InstaladorToggle / ProveedorToggle so a curl/Postman bypass can't store a price
  // outside the realistic MXN range.
  costo_instalador_override: z.number().nonnegative().max(9999999.99).nullable().optional(),
  costo_proveedor_override: z.number().nonnegative().max(9999999.99).nullable().optional(),

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
        // Variable values are physical magnitudes (dimensions, quantities, etc.)
        // and must be strictly positive. Upper bound is a safety net against
        // typo overflows; no realistic laser/print dimension exceeds it.
        valor: z
          .number()
          .positive("El valor debe ser mayor que 0")
          .max(99999999, "Valor demasiado grande"),
      })
    )
    .default([]),
});

export type CreateServicioInput = z.infer<typeof CreateServicioSchema>;
export type UpdateServicioInput = z.infer<typeof UpdateServicioSchema>;
export type CalcularPrecioInput = z.infer<typeof CalcularPrecioSchema>;

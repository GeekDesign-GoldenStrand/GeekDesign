import { z } from "zod";

const VariableSchema = z.object({
  id_tipo_variable: z.number().int().positive(),
  id_nombre_variable:z.string().min(1).max(100).regex(/^[a-zA-Z0-9_]+$/, "Solo minusculas, números y guiones bajos; "),
  etiqueta: z.string().min(1).max(100),
  valor_default: z.string().optional(),
  editable_por_cliente: z.boolean().default(false),
  unidad: z.string().optional(),
});

const ConstanteSchema = z.object({
  nombre_constante: z.string().min(1).max(100).regex(/^[a-z_][a-z0-9_]*$/, "Identificador inválido"),
  origen: z.enum(["maquina", "instalador", "proveedor"]),
  id_maquina: z.number().int().positive().optional(),
  id_instalador: z.number().int().positive().optional(),
  id_proveedor: z.number().int().positive().optional(),
})
.refine(data => {
  if (data.origen === "maquina") {
    return data.id_maquina !== undefined;
  }
  if (data.origen === "instalador") {
    return data.id_instalador !== undefined;
  }
  if (data.origen === "proveedor") {
    return data.id_proveedor !== undefined;
  } 
  return false;
  },
  { message: "El campo de ID correspondiente al origen seleccionado es requerido" }
);

const FormulaSchema = z.object({
  expresion: z.string().min(1).max(500),
  variables: z.array(VariableSchema).default([]),
  constantes: z.array(ConstanteSchema).default([]),
});

/*-----Schema Principal del Servicio-----*/

export const CreateServicioSchema = z.object({
  id_estatus: z.number().int().positive(),
  nombre_servicio: z.string().min(1).max(100),
  descripcion_servicio: z.string().optional(),
  estatus_servicio: z.boolean().default(true),


  // Array for entities to vinculate with this service
  id_maquinas: z.array(z.number().int().positive()).optional().default([]),
  id_instaladores: z.array(z.number().int().positive()).optional().default([]),
  id_proveedores: z.array(z.number().int().positive()).optional().default([]),

  formula: FormulaSchema.optional(),
});

export const UpdateServicioSchema = CreateServicioSchema.partial();

export const ServicioIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateServicioInput = z.infer<typeof CreateServicioSchema>;
export type UpdateServicioInput = z.infer<typeof UpdateServicioSchema>;

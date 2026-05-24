import { z } from "zod";

import { isValidKey } from "@/lib/storage/keys";

const NOMBRE_BLOCKED = /[\x00-\x1F\x7F<>{}\[\]\\|^~`*]/;

export const UNIDADES_MEDIDA = ["mm", "in", "cm", "mu", "pt"] as const;

const imagenKeyValidator = z
  .string()
  .max(500, "Máximo 500 caracteres.")
  .refine(
    (v) => isValidKey(v, "materiales"),
    "Debe ser una clave de almacenamiento válida (sube la imagen primero)."
  );

const nombreValidator = z
  .string()
  .min(1, "El nombre es requerido.")
  .max(100, "Máximo 100 caracteres.")
  .refine((v) => !NOMBRE_BLOCKED.test(v), "El nombre contiene caracteres no permitidos.");

const dimensionValidator = (label: string) =>
  z
    .number({ message: "Campo requerido" })
    .positive(`${label} debe ser mayor a 0.`)
    .refine((v) => Math.floor(Math.abs(v)).toString().length <= 8, "Máximo 8 dígitos enteros.")
    .refine((v) => (v.toString().split(".")[1] ?? "").length <= 2, "Máximo 2 decimales.");

// ── Individual material (existing, backward-compatible) ───────────────────────

export const CreateMaterialSchema = z.object({
  nombre_material: nombreValidator,
  descripcion_material: z
    .string()
    .min(1, "La descripción es requerida.")
    .max(500, "Máximo 500 caracteres."),
  unidad_medida: z.enum(UNIDADES_MEDIDA, { message: "La unidad de medida es requerida." }),
  ancho: dimensionValidator("El ancho"),
  alto: dimensionValidator("El alto"),
  grosor: dimensionValidator("El grosor"),
  color: z.string().min(1, "El color es requerido.").max(50, "Máximo 50 caracteres."),
  imagen_url: imagenKeyValidator.refine((v) => v.length >= 1, "La imagen es requerida."),
});

// ── Group (top-level, no dimensions) ─────────────────────────────────────────

export const CreateGrupoMaterialSchema = z.object({
  tipo: z.literal("grupo"),
  nombre_material: nombreValidator,
  descripcion_material: z.string().max(500, "Máximo 500 caracteres.").optional(),
  imagen_url: z
    .string()
    .max(500, "Máximo 500 caracteres.")
    .refine(
      (v) => !v || isValidKey(v, "materiales"),
      "Debe ser una clave de almacenamiento válida (sube la imagen primero)."
    )
    .optional(),
});

// ── Sub-material (variant, belongs to a group) ────────────────────────────────

export const CreateSubMaterialSchema = z.object({
  tipo: z.literal("sub"),
  id_material_padre: z.number().int().positive("Debes seleccionar un grupo."),
  nombre_material: nombreValidator,
  descripcion_material: z
    .string()
    .min(1, "La descripción es requerida.")
    .max(500, "Máximo 500 caracteres."),
  unidad_medida: z.enum(UNIDADES_MEDIDA, { message: "La unidad de medida es requerida." }),
  ancho: dimensionValidator("El ancho"),
  alto: dimensionValidator("El alto"),
  grosor: dimensionValidator("El grosor"),
  color: z.string().min(1, "El color es requerido.").max(50, "Máximo 50 caracteres."),
  imagen_url: imagenKeyValidator.refine((v) => v.length >= 1, "La imagen es requerida."),
});

// ── Update schema ─────────────────────────────────────────────────────────────

export const UpdateMaterialSchema = CreateMaterialSchema.partial().extend({
  id_material_padre: z.number().int().positive().nullable().optional(),
});

// ── Params ────────────────────────────────────────────────────────────────────

export const MaterialIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;
export type CreateGrupoMaterialInput = z.infer<typeof CreateGrupoMaterialSchema>;
export type CreateSubMaterialInput = z.infer<typeof CreateSubMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>;

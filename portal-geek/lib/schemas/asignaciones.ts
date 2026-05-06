import { z } from "zod";

export const AssignmentSchema = z.object({
  type: z.enum(["servicio", "material"]),
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        precio: z.number().positive(),
        notas: z.string().max(50).optional(),
      })
    )
    .refine((items) => new Set(items.map((i) => i.id)).size === items.length, {
      message: "Los IDs deben ser únicos",
    }),
});

export type AssignmentInput = z.infer<typeof AssignmentSchema>;

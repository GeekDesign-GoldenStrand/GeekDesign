import { z } from "zod";

export const AssignmentSchema = z.object({
  type: z.enum(["servicio", "material"]),
  ids: z
    .array(z.number().int().positive())
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Los IDs deben ser únicos",
    }),
});

export type AssignmentInput = z.infer<typeof AssignmentSchema>;

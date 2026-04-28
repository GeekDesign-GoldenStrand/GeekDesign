import { z } from "zod";

export const AssignmentSchema = z.object({
  type: z.enum(["servicio", "material"]),
  ids: z.array(z.number()),
});

export type AssignmentInput = z.infer<typeof AssignmentSchema>;

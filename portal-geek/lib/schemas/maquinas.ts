import { z } from "zod";

import { containsEmoji } from "@/lib/utils/format";

// Shared refine used by every free-text field on a Máquina. The maquinas UI
// already strips emoji on input via `stripEmoji` in lib/utils/format.ts, but
// a hand-rolled API request could still bypass the UI — this is the matching
// server-side gate so the contract is enforced in one place. Sharing the
// `containsEmoji` predicate guarantees the strip and the rejection can't
// silently drift apart.
const noEmoji = {
  check: (v: string) => !containsEmoji(v),
  message: "No se permiten emojis ni caracteres similares",
};

// Length caps match the frontend's `maxInputLength={30}` on Modelo / Apodo
// and `maxInputLength={200}` on Descripción — keeping them aligned means a
// payload that passes UI validation can't be rejected purely on length, and
// vice versa.
export const CreateMaquinaSchema = z.object({
  nombre_maquina: z.string().min(1).max(30).refine(noEmoji.check, noEmoji.message),
  apodo_maquina: z.string().min(1).max(30).refine(noEmoji.check, noEmoji.message),
  tipo: z.enum(["Láser CO2", "Láser Fibra", "Bordadora"]),
  descripcion: z.string().max(200).refine(noEmoji.check, noEmoji.message).optional(),
  estatus: z.enum(["Activa", "Inactiva", "En mantenimiento"]).default("Activa"),
});

export const UpdateMaquinaSchema = CreateMaquinaSchema.partial();

export const AsignarSucursalSchema = z.object({
  sucursal: z.number().int().positive(),
});

export const AsignarServiciosSchema = z.object({
  servicios: z.array(z.number().int().positive()),
});

export const MaquinaIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type AsignarSucursalInput = z.infer<typeof AsignarSucursalSchema>;
export type AsignarServiciosInput = z.infer<typeof AsignarServiciosSchema>;
export type CreateMaquinaInput = z.infer<typeof CreateMaquinaSchema>;
export type UpdateMaquinaInput = z.infer<typeof UpdateMaquinaSchema>;

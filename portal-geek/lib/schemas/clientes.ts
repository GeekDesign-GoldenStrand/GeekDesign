import { z } from "zod";

import { emailField } from "@/lib/utils/email";

import { noEmoji, textOnly, addressOnly } from "./text-validation";

// Admin form accepts free-form phone (local 10-digit numbers, sometimes with
// country code or spaces). Restrict the character set so the column can't
// store arbitrary strings, but don't require E.164 — that's enforced only on
// the storefront schema where the PhoneInput component already produces it.
const PHONE_CHARS = /^[\d\s\-+()]+$/;

export const CreateClienteSchema = z.object({
  nombre_cliente: z
    .string()
    .min(1)
    .max(100)
    .refine(noEmoji, { message: "El nombre no debe contener emojis" })
    .refine(textOnly, {
      message: "El nombre solo debe contener caracteres en inglés o español y signos comunes",
    }),
  empresa: z
    .string()
    .max(100)
    .optional()
    .refine((v) => (v ? noEmoji(v) : true), { message: "La empresa no debe contener emojis" })
    .refine((v) => (v ? textOnly(v) : true), {
      message: "La empresa solo debe contener caracteres en inglés o español y signos comunes",
    }),
  rfc: z.string().length(13).optional(),
  correo_electronico: emailField({ max: 150 }),
  numero_telefono: z.string().min(7, "El teléfono es demasiado corto").max(20).regex(PHONE_CHARS, {
    message: "El teléfono solo debe contener dígitos, espacios, +, -, ( y )",
  }),
  ubicacion: z
    .string()
    .max(200)
    .optional()
    .refine((v) => (v ? addressOnly(v) : true), {
      message: "La ubicación solo debe contener caracteres válidos de dirección",
    }),
  // `.nullable()` so the admin can clear the column (via the "Sin categoría"
  // option in the CategoryDropdown) — Prisma accepts `null` and the DB column
  // is already optional. `.optional()` covers the create path where the
  // category may simply be omitted.
  categoria: z.enum(["Black", "Silver", "Gold", "Emprendedor", "Baneado"]).nullable().optional(),
});

export const UpdateClienteSchema = CreateClienteSchema.partial();

export const ClienteIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateClienteInput = z.infer<typeof CreateClienteSchema>;
export type UpdateClienteInput = z.infer<typeof UpdateClienteSchema>;

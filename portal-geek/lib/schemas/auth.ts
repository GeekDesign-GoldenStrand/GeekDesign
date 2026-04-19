import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Correo inválido").max(150),
  password: z.string().min(1, "Contraseña requerida").max(255),
});

export type LoginInput = z.infer<typeof LoginSchema>;

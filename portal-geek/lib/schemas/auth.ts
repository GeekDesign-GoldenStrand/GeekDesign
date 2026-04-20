import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Correo inválido").max(150),
  password: z.string().min(1, "Contraseña requerida").max(255),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Correo inválido").max(150),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(255),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

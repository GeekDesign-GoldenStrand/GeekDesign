/**
 * @jest-environment node
 */
import {
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from "@/lib/schemas/auth";

describe("LoginSchema", () => {
  it("acepta email y password válidos", () => {
    const result = LoginSchema.safeParse({ email: "ada@example.com", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("rechaza email inválido", () => {
    const result = LoginSchema.safeParse({ email: "no-es-email", password: "secret" });
    expect(result.success).toBe(false);
  });

  it("rechaza password vacío", () => {
    const result = LoginSchema.safeParse({ email: "ada@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("ForgotPasswordSchema", () => {
  it("acepta un email válido", () => {
    expect(ForgotPasswordSchema.safeParse({ email: "ada@example.com" }).success).toBe(true);
  });

  it("rechaza un email inválido", () => {
    expect(ForgotPasswordSchema.safeParse({ email: "x" }).success).toBe(false);
  });
});

describe("ResetPasswordSchema", () => {
  const valid = {
    token: "reset-token",
    password: "Segura123",
    confirmPassword: "Segura123",
  };

  it("acepta una contraseña fuerte y confirmación coincidente", () => {
    expect(ResetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza contraseña sin mayúscula", () => {
    expect(
      ResetPasswordSchema.safeParse({
        ...valid,
        password: "segura123",
        confirmPassword: "segura123",
      }).success
    ).toBe(false);
  });

  it("rechaza contraseña sin número", () => {
    expect(
      ResetPasswordSchema.safeParse({
        ...valid,
        password: "SeguraPass",
        confirmPassword: "SeguraPass",
      }).success
    ).toBe(false);
  });

  it("rechaza contraseña menor a 8 caracteres", () => {
    expect(
      ResetPasswordSchema.safeParse({ ...valid, password: "Ab1", confirmPassword: "Ab1" }).success
    ).toBe(false);
  });

  it("rechaza cuando las contraseñas no coinciden", () => {
    const result = ResetPasswordSchema.safeParse({ ...valid, confirmPassword: "Otra123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("confirmPassword");
    }
  });

  it("rechaza token vacío", () => {
    expect(ResetPasswordSchema.safeParse({ ...valid, token: "" }).success).toBe(false);
  });
});

describe("ChangePasswordSchema", () => {
  const valid = {
    currentPassword: "Vieja123",
    newPassword: "Nueva123",
    confirmPassword: "Nueva123",
  };

  it("acepta un cambio de contraseña válido", () => {
    expect(ChangePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza currentPassword vacío", () => {
    expect(ChangePasswordSchema.safeParse({ ...valid, currentPassword: "" }).success).toBe(false);
  });

  it("rechaza newPassword débil", () => {
    expect(
      ChangePasswordSchema.safeParse({
        ...valid,
        newPassword: "debil",
        confirmPassword: "debil",
      }).success
    ).toBe(false);
  });

  it("rechaza cuando la confirmación no coincide", () => {
    const result = ChangePasswordSchema.safeParse({ ...valid, confirmPassword: "Distinta123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("confirmPassword");
    }
  });
});

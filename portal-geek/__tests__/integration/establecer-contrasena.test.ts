/**
 * @jest-environment node
 */
import { resetPassword } from "@/lib/services/password-reset";
import { NotFoundError } from "@/lib/utils/errors";

import { createApp } from "../helpers/next-supertest";

const mockGetCookie = jest.fn();
const mockDeleteCookie = jest.fn();
jest.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: mockGetCookie,
      delete: mockDeleteCookie,
    }),
}));

jest.mock("@/lib/services/password-reset", () => ({
  resetPassword: jest.fn(),
}));

const mockResetPassword = resetPassword as jest.Mock;

describe("POST /api/auth/establecer-contrasena", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/auth/establecer-contrasena/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna 200 con token de cookie válido y contraseña fuerte", async () => {
    mockResetPassword.mockResolvedValue(undefined);
    mockGetCookie.mockReturnValue({ value: "colab-token" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/establecer-contrasena")
      .send({ password: "Segura123", confirmPassword: "Segura123" });

    expect(res.status).toBe(200);
    expect(mockResetPassword).toHaveBeenCalledWith("colab-token", "Segura123");
    expect(mockDeleteCookie).toHaveBeenCalledWith("reset_token");
  });

  it("retorna 401 cuando no existe la cookie reset_token", async () => {
    mockGetCookie.mockReturnValue(undefined);

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/establecer-contrasena")
      .send({ password: "Segura123", confirmPassword: "Segura123" });

    expect(res.status).toBe(401);
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("retorna 404 cuando el token es inválido o expiró", async () => {
    mockResetPassword.mockRejectedValue(new NotFoundError("inválido o ya expiró"));
    mockGetCookie.mockReturnValue({ value: "bad-token" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/establecer-contrasena")
      .send({ password: "Segura123", confirmPassword: "Segura123" });

    expect(res.status).toBe(404);
  });

  it("retorna 422 con contraseña débil o confirmación distinta", async () => {
    mockGetCookie.mockReturnValue({ value: "colab-token" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/establecer-contrasena")
      .send({ password: "weak", confirmPassword: "different" });

    expect(res.status).toBe(422);
    expect(mockResetPassword).not.toHaveBeenCalled();
  });
});

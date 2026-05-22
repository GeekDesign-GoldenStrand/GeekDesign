/**
 * @jest-environment node
 */
import { loginUser } from "@/lib/services/auth";
import { changePassword } from "@/lib/services/change-password";
import { requestPasswordReset, resetPassword } from "@/lib/services/password-reset";
import { updateUsuario } from "@/lib/services/usuarios";
import { NotFoundError, UnauthorizedError } from "@/lib/utils/errors";

import { createApp } from "../helpers/next-supertest";

// Session module is mocked so we never touch jose (ESM, untranspiled in jest).
// Constants are hardcoded to their real values from lib/auth/session.ts.
const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  SESSION_COOKIE: "gd_session",
  SESSION_MAX_AGE_SECONDS: 60 * 60 * 8,
  getSession: () => mockGetSession(),
}));

const mockCheckRateLimit = jest.fn(() => ({ allowed: true, remaining: 4 }));
jest.mock("@/lib/utils/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...(args as [])),
}));

jest.mock("@/lib/services/auth", () => ({ loginUser: jest.fn() }));
jest.mock("@/lib/services/password-reset", () => ({
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
}));
jest.mock("@/lib/services/change-password", () => ({ changePassword: jest.fn() }));
jest.mock("@/lib/services/usuarios", () => ({
  getUsuario: jest.fn(),
  updateUsuario: jest.fn(),
  deleteUsuario: jest.fn(),
}));

const mockLoginUser = loginUser as jest.Mock;
const mockRequestReset = requestPasswordReset as jest.Mock;
const mockResetPassword = resetPassword as jest.Mock;
const mockChangePassword = changePassword as jest.Mock;
const mockUpdateUsuario = updateUsuario as jest.Mock;

// ─────────────────────────────────────────────────────────────────────────────
// AU-01 — /api/auth/login + /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
describe("AU-01 POST /api/auth/login", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/auth/login/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 4 });
  });

  it("AU01-I1: 200 + cookie de sesión con credenciales válidas", async () => {
    mockLoginUser.mockResolvedValue({
      token: "jwt-token",
      user: {
        id: 1,
        nombre_completo: "Ada",
        correo_electronico: "ada@x.com",
        rol: "Administrador",
      },
    });

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/login")
      .send({ email: "ada@x.com", password: "secret" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(1);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.join(";")).toContain("gd_session=jwt-token");
  });

  it("AU01-I2: 422 con body inválido (email mal formado / password vacío)", async () => {
    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/login")
      .send({ email: "no-es-email", password: "" });

    expect(res.status).toBe(422);
    expect(mockLoginUser).not.toHaveBeenCalled();
  });

  it("AU01-I3: 401 con credenciales inválidas (sin cookie)", async () => {
    mockLoginUser.mockRejectedValue(new UnauthorizedError("Credenciales inválidas"));

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/login")
      .send({ email: "ada@x.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("AU01-I3b: 401 cuando se excede el rate limit (mismo mensaje genérico)", async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0 });

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/login")
      .send({ email: "ada@x.com", password: "secret" });

    expect(res.status).toBe(401);
    expect(mockLoginUser).not.toHaveBeenCalled();
  });
});

describe("AU-01 POST /api/auth/logout", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/auth/logout/route");
  });

  it("AU01-I4: 200 y limpia la cookie de sesión", async () => {
    const res = await createApp({ POST: routes.POST }).post("/api/auth/logout");

    expect(res.status).toBe(200);
    const cookies = (res.headers["set-cookie"] as unknown as string[]) ?? [];
    expect(cookies.join(";")).toContain("gd_session=");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AU-02 — /api/auth/forgot-password + /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
describe("AU-02 POST /api/auth/forgot-password", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/auth/forgot-password/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("AU02-I1: 200 con mensaje genérico cuando el correo existe", async () => {
    mockRequestReset.mockResolvedValue(undefined);

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/forgot-password")
      .send({ email: "ada@x.com" });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/Si el correo existe/i);
  });

  it("AU02-I1b: 200 con el MISMO mensaje cuando el correo no existe (anti-enumeración)", async () => {
    mockRequestReset.mockResolvedValue(undefined); // service is silent for unknown emails

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/forgot-password")
      .send({ email: "nadie@x.com" });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/Si el correo existe/i);
  });

  it("AU02-I1c: 422 con email inválido", async () => {
    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/forgot-password")
      .send({ email: "x" });

    expect(res.status).toBe(422);
    expect(mockRequestReset).not.toHaveBeenCalled();
  });
});

describe("AU-02 POST /api/auth/reset-password", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/auth/reset-password/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("AU02-I2: 200 con token válido y contraseña fuerte", async () => {
    mockResetPassword.mockResolvedValue(undefined);

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/reset-password")
      .send({ token: "valid-token", password: "Segura123", confirmPassword: "Segura123" });

    expect(res.status).toBe(200);
    expect(mockResetPassword).toHaveBeenCalledWith("valid-token", "Segura123");
  });

  it("AU02-I3: 404 cuando el token es inválido o expiró", async () => {
    mockResetPassword.mockRejectedValue(new NotFoundError("inválido o ya expiró"));

    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/reset-password")
      .send({ token: "bad", password: "Segura123", confirmPassword: "Segura123" });

    expect(res.status).toBe(404);
  });

  it("AU02-I3b: 422 con contraseña débil o confirmación distinta", async () => {
    const res = await createApp({ POST: routes.POST })
      .post("/api/auth/reset-password")
      .send({ token: "t", password: "weak", confirmPassword: "different" });

    expect(res.status).toBe(422);
    expect(mockResetPassword).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AU-03 — /api/auth/change-password (PUT, autenticado)
// ─────────────────────────────────────────────────────────────────────────────
describe("AU-03 PUT /api/auth/change-password", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/auth/change-password/route");
  });

  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    currentPassword: "Vieja123",
    newPassword: "Nueva123",
    confirmPassword: "Nueva123",
  };

  it("AU03-I2: 401 sin sesión", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ PUT: routes.PUT })
      .put("/api/auth/change-password")
      .send(validBody);

    expect(res.status).toBe(401);
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("AU03-I1: 200 autenticado con body válido", async () => {
    mockGetSession.mockResolvedValue({ id: 9, email: "ada@x.com", role: "Colaborador" });
    mockChangePassword.mockResolvedValue(undefined);

    const res = await createApp({ PUT: routes.PUT })
      .put("/api/auth/change-password")
      .send(validBody);

    expect(res.status).toBe(200);
    expect(mockChangePassword).toHaveBeenCalledWith(9, "Vieja123", "Nueva123");
  });

  it("AU03-I3: 401 cuando la contraseña actual es incorrecta", async () => {
    mockGetSession.mockResolvedValue({ id: 9, email: "ada@x.com", role: "Colaborador" });
    mockChangePassword.mockRejectedValue(
      new UnauthorizedError("La contraseña actual es incorrecta")
    );

    const res = await createApp({ PUT: routes.PUT })
      .put("/api/auth/change-password")
      .send(validBody);

    expect(res.status).toBe(401);
  });

  it("AU03-I4: 422 con body inválido (nueva contraseña débil)", async () => {
    mockGetSession.mockResolvedValue({ id: 9, email: "ada@x.com", role: "Colaborador" });

    const res = await createApp({ PUT: routes.PUT })
      .put("/api/auth/change-password")
      .send({ currentPassword: "Vieja123", newPassword: "weak", confirmPassword: "weak" });

    expect(res.status).toBe(422);
    expect(mockChangePassword).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AU-04 — modificar rol vía PUT /api/usuarios/[id] (solo Dirección)
// ─────────────────────────────────────────────────────────────────────────────
describe("AU-04 PUT /api/usuarios/[id] (modificar rol)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/usuarios/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  function app() {
    return createApp({ PUT: routes.PUT }, (url) => {
      const segments = url.pathname.split("/");
      return { id: segments[segments.length - 1] };
    });
  }

  it("AU04-I3: 401 sin sesión", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await app().put("/api/usuarios/5").send({ id_rol: 2 });

    expect(res.status).toBe(401);
    expect(mockUpdateUsuario).not.toHaveBeenCalled();
  });

  it("AU04-I2: 403 cuando un Colaborador intenta cambiar un rol", async () => {
    mockGetSession.mockResolvedValue({ id: 1, email: "c@x.com", role: "Colaborador" });

    const res = await app().put("/api/usuarios/5").send({ id_rol: 2 });

    expect(res.status).toBe(403);
    expect(mockUpdateUsuario).not.toHaveBeenCalled();
  });

  it("AU04-I1: 200 cuando Dirección cambia el rol", async () => {
    mockGetSession.mockResolvedValue({ id: 1, email: "dir@x.com", role: "Direccion" });
    mockUpdateUsuario.mockResolvedValue({
      id_usuario: 5,
      id_rol: 2,
      rol: { id_rol: 2, nombre_rol: "Finanzas" },
    });

    const res = await app().put("/api/usuarios/5").send({ id_rol: 2 });

    expect(res.status).toBe(200);
    expect(mockUpdateUsuario).toHaveBeenCalledWith(5, { id_rol: 2 });
    expect(res.body.data.id_rol).toBe(2);
  });

  it("AU04-I1b: 404 cuando el usuario no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, email: "dir@x.com", role: "Direccion" });
    mockUpdateUsuario.mockRejectedValue(new NotFoundError("Usuario no encontrado"));

    const res = await app().put("/api/usuarios/999").send({ id_rol: 2 });

    expect(res.status).toBe(404);
  });

  it("AU04-I4: 422 cuando id_rol es inválido (no positivo)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, email: "dir@x.com", role: "Direccion" });

    const res = await app().put("/api/usuarios/5").send({ id_rol: -1 });

    expect(res.status).toBe(422);
    expect(mockUpdateUsuario).not.toHaveBeenCalled();
  });
});

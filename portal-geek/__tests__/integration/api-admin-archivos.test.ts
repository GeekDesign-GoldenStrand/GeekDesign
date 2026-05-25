/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";

// ─── Auth mock (mismo patrón que el resto de tests de integración) ────────────

const mockGetSession = jest.fn();
type Handler = (req: Request, ctx: { params: unknown }, session?: unknown) => Promise<Response>;

jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

jest.mock("@/lib/auth/guards", () => ({
  withRoleParams:
    (roles: string[], handler: Handler) => async (req: Request, ctx: { params: unknown }) => {
      const session = await getSession();
      if (!session) {
        return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
      }
      if (!roles.includes((session as { role: string }).role)) {
        return new Response(JSON.stringify({ error: "Sin permisos" }), { status: 403 });
      }
      return handler(req, ctx, session);
    },
}));

// ─── Storage + Prisma mocks ───────────────────────────────────────────────────

const mockPresignGet = jest.fn().mockResolvedValue("https://storage.example.com/signed-url");

jest.mock("@/lib/services/storage", () => ({
  presignGet: (...args: unknown[]) => mockPresignGet(...args),
}));

const mockFindUnique = jest.fn();

jest.mock("@/lib/db/client", () => ({
  prisma: {
    archivosDisenio: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(): NextRequest {
  return {} as unknown as NextRequest;
}

function makeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/admin/archivos/[id]", () => {
  let GET: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import("@/app/api/admin/archivos/[id]/route");
    GET = mod.GET as typeof GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
  });

  it("redirige a la URL firmada para un archivo válido", async () => {
    mockFindUnique.mockResolvedValue({
      id_archivo: 5,
      url_archivo: "disenios/2026/05/abc.ai",
      nombre_archivo: "logo_cliente.ai",
    });

    const res = await GET(makeRequest(), makeCtx("5"));

    expect(res.status).toBe(307); // NextResponse.redirect
    expect(mockPresignGet).toHaveBeenCalledWith(
      "disenios/2026/05/abc.ai",
      undefined,
      "logo_cliente.ai"
    );
  });

  it("pasa el nombre_archivo como tercer argumento a presignGet", async () => {
    mockFindUnique.mockResolvedValue({
      id_archivo: 7,
      url_archivo: "disenios/2026/05/plano.dxf",
      nombre_archivo: "plano_corte.dxf",
    });

    await GET(makeRequest(), makeCtx("7"));

    expect(mockPresignGet).toHaveBeenCalledWith(
      "disenios/2026/05/plano.dxf",
      undefined,
      "plano_corte.dxf"
    );
  });

  it("devuelve 404 para el archivo placeholder", async () => {
    // Reflect real seed values: sentinel lives in nombre_archivo, url_archivo
    // is a fake https URL. Both fields together trigger the guard.
    mockFindUnique.mockResolvedValue({
      id_archivo: 1,
      url_archivo: "https://placeholder.invalid/no-design-yet",
      nombre_archivo: "__PLACEHOLDER__",
    });

    const res = await GET(makeRequest(), makeCtx("1"));
    expect(res.status).toBe(404);
    // presignGet must never be called with the fake URL — that would cause a
    // GCS NoSuchKey error and redirect the browser to a broken signed URL.
    expect(mockPresignGet).not.toHaveBeenCalled();
  });

  it("devuelve 404 si el archivo no existe en la DB", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest(), makeCtx("999"));
    expect(res.status).toBe(404);
  });

  it("devuelve 404 para un id no numérico", async () => {
    const res = await GET(makeRequest(), makeCtx("abc"));
    expect(res.status).toBe(404);
  });

  it("devuelve 401 sin sesión", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET(makeRequest(), makeCtx("5"));
    expect(res.status).toBe(401);
  });

  it("devuelve 403 para un rol distinto de Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 2, role: "Operador" });
    const res = await GET(makeRequest(), makeCtx("5"));
    expect(res.status).toBe(403);
  });
});

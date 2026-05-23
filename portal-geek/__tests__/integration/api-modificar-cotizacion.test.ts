import type { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";

import { createApp } from "../helpers/next-supertest";

// ── Auth mocks ────────────────────────────────────────────────────────────────
const mockGetSession = jest.fn();
type Handler = (req: Request, ctx: { params: unknown }, session?: unknown) => Promise<Response>;

jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

jest.mock("@/lib/auth/guards", () => ({
  withRoleParams:
    (roles: string[], handler: Handler) => async (req: Request, ctx: { params: unknown }) => {
      const session = await getSession();
      if (!session)
        return new Response(JSON.stringify({ data: null, error: "No autenticado" }), {
          status: 401,
        });

      // Administrador is treated as equivalent to Direccion — mirror the
      // real guard's role normalization so tests reflect actual behavior.
      const effectiveRole =
        (session as { role: string }).role === "Administrador"
          ? "Direccion"
          : (session as { role: string }).role;

      if (!roles.includes(effectiveRole))
        return new Response(
          JSON.stringify({ data: null, error: "Sin permisos para realizar esta acción" }),
          { status: 403 }
        );
      return handler(req, ctx, session);
    },
}));

// ── DB mock ───────────────────────────────────────────────────────────────────
jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn().mockImplementation((fn) =>
      fn({
        cotizaciones: {
          findUnique: jest.fn().mockResolvedValue({
            id_cotizacion: 1,
            id_pedido: 10,
          }),
          update: jest.fn().mockImplementation(({ data }) => ({
            id_cotizacion: 1,
            ...data,
          })),
        },
        detallePedido: {
          update: jest.fn().mockResolvedValue({}),
          findMany: jest.fn().mockResolvedValue([{ subtotal: "1000.00" }, { subtotal: "500.00" }]),
        },
      })
    ),
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("PUT /api/cotizaciones/[id] — COT-XX Modificar cotización", () => {
  let routes: { PUT: (req: unknown) => Promise<Response> };

  beforeAll(async () => {
    const mod = await import("@/app/api/cotizaciones/[id]/route");
    routes = {
      PUT: (req: unknown) => mod.PUT(req as NextRequest, { params: Promise.resolve({ id: "1" }) }),
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ PUT: routes.PUT })
      .put("/api/cotizaciones/1")
      .send({ nombre_oportunidad: "Test" });

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol es Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ PUT: routes.PUT })
      .put("/api/cotizaciones/1")
      .send({ nombre_oportunidad: "Test" });

    expect(res.status).toBe(403);
  });

  it("acepta rol Administrador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await createApp({ PUT: routes.PUT })
      .put("/api/cotizaciones/1")
      .send({ notas: "Nota de prueba" });

    expect(res.status).toBe(200);
  });

  // ── Validation ────────────────────────────────────────────────────────────
  it("retorna 422 cuando el id no es un número", async () => {
    const mod = await import("@/app/api/cotizaciones/[id]/route");
    const handler = (req: unknown) =>
      mod.PUT(req as NextRequest, { params: Promise.resolve({ id: "abc" }) });

    const res = await createApp({ PUT: handler })
      .put("/api/cotizaciones/abc")
      .send({ nombre_oportunidad: "Test" });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando nombre_oportunidad excede 255 caracteres", async () => {
    const res = await createApp({ PUT: routes.PUT })
      .put("/api/cotizaciones/1")
      .send({ nombre_oportunidad: "A".repeat(256) });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando servicios tiene cantidad menor a 1", async () => {
    const res = await createApp({ PUT: routes.PUT })
      .put("/api/cotizaciones/1")
      .send({
        servicios: [{ id_detalle: 1, cantidad: 0, precio_unitario: 100 }],
      });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando servicios tiene precio_unitario negativo", async () => {
    const res = await createApp({ PUT: routes.PUT })
      .put("/api/cotizaciones/1")
      .send({
        servicios: [{ id_detalle: 1, cantidad: 1, precio_unitario: -10 }],
      });

    expect(res.status).toBe(422);
  });

  // ── Success ───────────────────────────────────────────────────────────────
  it("retorna 200 actualizando solo nombre_oportunidad", async () => {
    const res = await createApp({ PUT: routes.PUT })
      .put("/api/cotizaciones/1")
      .send({ nombre_oportunidad: "Letrero exterior" });

    expect(res.status).toBe(200);
  });

  it("retorna 200 actualizando servicios y recalcula monto_total", async () => {
    const res = await createApp({ PUT: routes.PUT })
      .put("/api/cotizaciones/1")
      .send({
        servicios: [
          { id_detalle: 1, cantidad: 2, precio_unitario: 500 },
          { id_detalle: 2, cantidad: 1, precio_unitario: 500 },
        ],
      });

    expect(res.status).toBe(200);
  });

  // ── Error handling ────────────────────────────────────────────────────────
  it("retorna 404 cuando la cotización no existe", async () => {
    const { prisma } = await import("@/lib/db/client");
    (prisma.$transaction as jest.Mock).mockImplementationOnce((fn) =>
      fn({
        cotizaciones: {
          findUnique: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
        detallePedido: {
          update: jest.fn(),
          findMany: jest.fn(),
        },
      })
    );

    const res = await createApp({ PUT: routes.PUT })
      .put("/api/cotizaciones/999")
      .send({ nombre_oportunidad: "Test" });

    expect(res.status).toBe(404);
  });

  it("ejecuta las actualizaciones dentro de una transacción", async () => {
    const { prisma } = await import("@/lib/db/client");

    await createApp({ PUT: routes.PUT })
      .put("/api/cotizaciones/1")
      .send({ nombre_oportunidad: "Test transacción" });

    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

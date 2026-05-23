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
      if (!roles.includes((session as { role: string }).role))
        return new Response(
          JSON.stringify({ data: null, error: "Sin permisos para realizar esta acción" }),
          { status: 403 }
        );
      return handler(req, ctx, session);
    },
}));

// ── DB mock ───────────────────────────────────────────────────────────────────
const mockCotizacionFindUnique = jest.fn();
const mockCotizacionUpdate = jest.fn();

jest.mock("@/lib/db/client", () => ({
  prisma: {
    cotizaciones: {
      findUnique: (...args: unknown[]) => mockCotizacionFindUnique(...args),
      update: (...args: unknown[]) => mockCotizacionUpdate(...args),
    },
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("PATCH /api/cotizaciones/[id]/descuento — COT-06 Agregar/eliminar descuento", () => {
  let routes: { PATCH: (req: unknown) => Promise<Response> };

  beforeAll(async () => {
    const mod = await import("@/app/api/cotizaciones/[id]/descuento/route");
    routes = {
      PATCH: (req: unknown) =>
        mod.PATCH(req as NextRequest, { params: Promise.resolve({ id: "1" }) }),
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockCotizacionFindUnique.mockResolvedValue({
      id_cotizacion: 1,
      monto_total: "1000.00",
      porcentaje_descuento: null,
      motivo_descuento: null,
      id_estatus_cotizacion: 1,
      estatus: { descripcion: "Pendiente" },
    });
    mockCotizacionUpdate.mockImplementation(({ data }) => ({
      id_cotizacion: 1,
      ...data,
    }));
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({ porcentaje_descuento: 10 });

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol es Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({ porcentaje_descuento: 10 });

    expect(res.status).toBe(403);
  });

  // ── Validation ────────────────────────────────────────────────────────────
  it("retorna 422 cuando el id no es un número", async () => {
    const mod = await import("@/app/api/cotizaciones/[id]/descuento/route");
    const handler = (req: unknown) =>
      mod.PATCH(req as NextRequest, { params: Promise.resolve({ id: "abc" }) });

    const res = await createApp({ PATCH: handler })
      .patch("/api/cotizaciones/abc/descuento")
      .send({ porcentaje_descuento: 10 });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando porcentaje_descuento es 0", async () => {
    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({ porcentaje_descuento: 0 });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando porcentaje_descuento supera 100", async () => {
    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({ porcentaje_descuento: 101 });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando porcentaje_descuento no es entero", async () => {
    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({ porcentaje_descuento: 10.5 });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando motivo_descuento excede 255 caracteres", async () => {
    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({
        porcentaje_descuento: 10,
        motivo_descuento: "A".repeat(256),
      });

    expect(res.status).toBe(422);
  });

  // ── Apply discount ────────────────────────────────────────────────────────
  it("retorna 200 al aplicar un descuento válido", async () => {
    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({ porcentaje_descuento: 10 });

    expect(res.status).toBe(200);
  });

  it("retorna 200 al aplicar descuento con motivo opcional", async () => {
    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({ porcentaje_descuento: 15, motivo_descuento: "Cliente frecuente" });

    expect(res.status).toBe(200);
    expect(mockCotizacionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          porcentaje_descuento: 15,
          motivo_descuento: "Cliente frecuente",
        }),
      })
    );
  });

  it("acepta rol Administrador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({ porcentaje_descuento: 5 });

    expect(res.status).toBe(200);
  });

  // ── Delete discount ───────────────────────────────────────────────────────
  it("retorna 200 al eliminar descuento enviando null", async () => {
    mockCotizacionFindUnique.mockResolvedValue({
      id_cotizacion: 1,
      monto_total: "900.00",
      porcentaje_descuento: "10.00",
      motivo_descuento: "Cliente frecuente",
      id_estatus_cotizacion: 1,
      estatus: { descripcion: "Pendiente" },
    });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({ porcentaje_descuento: null, motivo_descuento: null });

    expect(res.status).toBe(200);
    expect(mockCotizacionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          porcentaje_descuento: null,
          motivo_descuento: null,
        }),
      })
    );
  });

  // ── Error handling ────────────────────────────────────────────────────────
  it("retorna 404 cuando la cotización no existe", async () => {
    mockCotizacionFindUnique.mockResolvedValue(null);

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/999/descuento")
      .send({ porcentaje_descuento: 10 });

    expect(res.status).toBe(404);
  });

  it("retorna 409 cuando la cotización no está en estatus editable", async () => {
    mockCotizacionFindUnique.mockResolvedValue({
      id_cotizacion: 1,
      monto_total: "1000.00",
      porcentaje_descuento: null,
      motivo_descuento: null,
      id_estatus_cotizacion: 3,
      estatus: { descripcion: "Aprobada" },
    });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/descuento")
      .send({ porcentaje_descuento: 10 });

    expect(res.status).toBe(409);
  });
});
/**
 * @jest-environment node
 */

import type { NextRequest } from "next/server";

import { createApp } from "../helpers/next-supertest";

// Mock de sesión para simular distintos escenarios de autenticación
const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

describe("PATCH /api/cotizaciones/:id/estatus", () => {
  let routes: { PATCH: (req: unknown) => Promise<Response> };

  beforeAll(async () => {
    // Importamos el handler real y le inyectamos params
    const mod = await import("@/app/api/cotizaciones/[id]/estatus/route");
    routes = {
      PATCH: (req: unknown) =>
        mod.PATCH(req as NextRequest, { params: Promise.resolve({ id: "1" }) }),
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 without a session", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Validada" });

    console.error("Response body:", res.body);
    expect(res.status).toBe(401);
  });

  it("returns 403 when role is Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Validada" });

    console.error("Response body:", res.body);
    expect(res.status).toBe(403);
  });

  it("returns 200 when role is Dirección and status is validated", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Validada" });

    console.error("Response body:", res.body);
    expect(res.status).toBe(200);
    expect(res.body.id_estatus_cotizacion).toBe(2);
  });

  it("returns 200 when role is Administrador and status is rejected", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Rechazada" });

    console.error("Response body:", res.body);
    expect(res.status).toBe(200);
    expect(res.body.id_estatus_cotizacion).toBe(4);
  });
});

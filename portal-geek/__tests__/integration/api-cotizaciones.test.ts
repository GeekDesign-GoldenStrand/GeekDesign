/**
 * @jest-environment node
 */
import { createApp } from "../helpers/next-supertest";
import { NextRequest } from "next/server";

// We mock the session to simulate different authentication scenarios.
// This allows us to test authorization logic without relying on real sessions.
const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

describe("PATCH /api/cotizaciones/:id/estatus", () => {
  let routes: any;

  beforeAll(async () => {
    // Import the route handler and inject params manually.
    // This ensures the test runs against the same code used in production.
    const mod = await import("@/app/api/cotizaciones/[id]/estatus/route");
    routes = {
      PATCH: (req: any) => mod.PATCH(req, { params: Promise.resolve({ id: "1" }) }),
    };
  });

  beforeEach(() => {
    // Clear mocks before each test to avoid cross-contamination.
    jest.clearAllMocks();
  });

  it("returns 401 without a session", async () => {
    // Why: We want to confirm that unauthenticated users are blocked.
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Validada" });

    console.log("Response body:", res.body);
    expect(res.status).toBe(401);
  });

  it("returns 403 when role is Colaborador", async () => {
    // Why: Even authenticated users should be denied if their role lacks permission.
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Validada" });

    console.log("Response body:", res.body);
    expect(res.status).toBe(403);
  });

  it("returns 200 when role is Dirección and status is validated", async () => {
    // Why: Dirección role should be authorized to validate cotizaciones.
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Validada" });

    console.log("Response body:", res.body);
    expect(res.status).toBe(200);
    // Why: We check the updated status ID to confirm the business rule was applied.
    expect(res.body.id_estatus_cotizacion).toBe(2);
  });

  it("returns 200 when role is Administrador and status is rejected", async () => {
    // Why: Administrador role should be authorized to reject cotizaciones.
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Rechazada" });

    console.log("Response body:", res.body);
    expect(res.status).toBe(200);
    // Why: We check the updated status ID to confirm rejection was applied correctly.
    expect(res.body.id_estatus_cotizacion).toBe(4);
  });
});

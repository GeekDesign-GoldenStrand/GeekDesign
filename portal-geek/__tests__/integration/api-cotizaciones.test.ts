/**
 * @jest-environment node
 */
import type { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";

import { createApp } from "../helpers/next-supertest";

// We mock the session to simulate different authentication scenarios.
// This allows us to test authorization logic without relying on real sessions.
const mockGetSession = jest.fn();
type Handler = (req: Request, ctx: { params: unknown }, session?: unknown) => Promise<Response>;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
});

jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

jest.mock("@/lib/auth/guards", () => ({
  withRole:
    (roles: string[], handler: Handler) => async (req: Request, ctx: { params: unknown }) => {
      const session = await getSession();

      if (!session) {
        return new Response(JSON.stringify({ data: null, error: "No autenticado" }), {
          status: 401,
        });
      }

      if (!roles.includes(session.role)) {
        return new Response(
          JSON.stringify({ data: null, error: "Sin permisos para realizar esta acción" }),
          { status: 403 }
        );
      }

      return handler(req, ctx);
    },

  withRoleParams:
    (roles: string[], handler: Handler) => async (req: Request, ctx: { params: unknown }) => {
      const session = await getSession();

      if (!session) {
        return new Response(JSON.stringify({ data: null, error: "No autenticado" }), {
          status: 401,
        });
      }

      if (!roles.includes(session.role)) {
        return new Response(
          JSON.stringify({ data: null, error: "Sin permisos para realizar esta acción" }),
          { status: 403 }
        );
      }

      return handler(req, ctx, session);
    },
}));

jest.mock("@/lib/db/client", () => ({
  prisma: {
    cotizaciones: {
      findUnique: jest.fn().mockResolvedValue({
        id_cotizacion: 1,
        id_estatus_cotizacion: 2,
      }),
      update: jest.fn().mockImplementation(({ data }) => ({
        id_cotizacion: 1,
        id_estatus_cotizacion: data.id_estatus_cotizacion,
      })),
    },
    historialEstadosCotizacion: {
      create: jest.fn(),
    },
    estatusCotizacion: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const value = Object.values(where)[0];

        if (value === "Validada") {
          return Promise.resolve({ id_estatus: 2 });
        }
        if (value === "Rechazada") {
          return Promise.resolve({ id_estatus: 4 });
        }
        return Promise.resolve(null);
      }),
    },
    $transaction: jest.fn().mockImplementation((queries) => Promise.all(queries)),
  },
}));

describe("PATCH /api/cotizaciones/:id/estatus", () => {
  let routes: { PATCH: (req: NextRequest) => Promise<NextResponse> };

  beforeAll(async () => {
    // Import the route handler and inject params manually.
    // This ensures the test runs against the same code used in production.
    const mod = await import("@/app/api/cotizaciones/[id]/estatus/route");
    routes = {
      PATCH: (req: NextRequest) => mod.PATCH(req, { params: Promise.resolve({ id: "1" }) }),
    };
  });

  it("returns 401 without a session", async () => {
    // Why: We want to confirm that unauthenticated users are blocked.
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Validada" });

    console.error("Response body:", res.body);
    expect(res.status).toBe(401);
  });

  it("returns 403 when role is Colaborador", async () => {
    // Why: Even authenticated users should be denied if their role lacks permission.
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Validada" });

    console.error("Response body:", res.body);
    expect(res.status).toBe(403);
  });

  it("returns 200 when role is Dirección and status is validated", async () => {
    // Why: Dirección role should be authorized to validate cotizaciones.
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Validada" });

    console.error("Response body:", res.body);
    expect(res.status).toBe(200);
    // Why: We check the updated status ID to confirm the business rule was applied.
    expect(res.body.id_estatus_cotizacion).toBe(2);
  });

  it("returns 200 when role is Direccion and status is rejected", async () => {
    // Why: Administrador role should be authorized to reject cotizaciones.
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ PATCH: routes.PATCH })
      .patch("/api/cotizaciones/1/estatus")
      .send({ estatus: "Rechazada" });

    console.error("Response body:", res.body);
    expect(res.status).toBe(200);
    // Why: We check the updated status ID to confirm rejection was applied correctly.
    expect(res.body.id_estatus_cotizacion).toBe(4);
  });
});

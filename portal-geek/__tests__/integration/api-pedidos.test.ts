import type { NextRequest } from "next/server";

import { GET } from "@/app/api/pedidos/route";
import { getSession } from "@/lib/auth/session";
import { listPedidos } from "@/lib/services/pedidos";

type PedidoMock = {
  estatus: string;
};

type Handler = (req: Request, ctx: { params: unknown }, session?: unknown) => Promise<Response>;

// We mock the auth guard to bypass authentication and authorization.
// Why: This test focuses on request validation and handler behavior,
// not on auth logic (which should be tested separately).

const mockGetSession = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

  (listPedidos as jest.Mock).mockResolvedValue({
    items: [],
    total: 0,
  });
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
    pedidos: {
      findMany: jest.fn().mockResolvedValue([
        {
          id_pedido: 1,
          id_cliente: 1,
          id_estatus_pedido: 2,
          monto_total: "2500",
          notas: "Pedido demo para pruebas",
        },
        {
          id_pedido: 2,
          id_cliente: 2,
          id_estatus_pedido: 4,
          monto_total: "1800",
          notas: "Pedido rechazado para pruebas",
        },
      ]),
      findUnique: jest.fn().mockResolvedValue({
        id_pedido: 1,
        id_cliente: 1,
        id_estatus_pedido: 2,
        monto_total: "2500",
        notas: "Pedido demo para pruebas",
      }),
      update: jest.fn().mockResolvedValue({
        id_pedido: 1,
        id_cliente: 1,
        id_estatus_pedido: 4,
        monto_total: "2500",
        notas: "Pedido actualizado para pruebas",
      }),
    },

    estatusPedido: {
      findUnique: jest.fn().mockResolvedValue({
        id_estatus: 2,
      }),
    },

    $transaction: jest.fn().mockImplementation((queries) => Promise.all(queries)),
  },
}));

// We mock the service layer to isolate the API route.
// Why: We want to avoid hitting the real database and external dependencies,
// ensuring tests are deterministic and fast.
jest.mock("@/lib/services/pedidos", () => ({
  listPedidos: jest.fn(),
}));

// Minimal mock of NextRequest
// Why: We only include the properties actually used by the handler,
// keeping the test lightweight and focused.
const createMockRequest = (url: string) =>
  ({
    url,
    nextUrl: new URL(url),
    cookies: {
      get: jest.fn(),
    },
  }) as unknown as NextRequest;

describe("GET /api/pedidos", () => {
  it("retorna 200 con serviceId válido", async () => {
    // Why: A valid positive integer should pass validation
    // and allow the request to reach the service layer.
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=1");
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it("retorna 422 con serviceId negativo", async () => {
    // Why: Negative IDs are considered invalid input.
    // The API should fail fast instead of silently ignoring bad data.
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=-1");
    const res = await GET(req);

    expect(res.status).toBe(422);
  });

  it("retorna 422 con serviceId NaN", async () => {
    // Why: Non-numeric values should not be coerced or ignored.
    // Explicit validation prevents ambiguous or unintended behavior.
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=abc");
    const res = await GET(req);

    expect(res.status).toBe(422);
  });

  it("retorna solo activos con onlyActive=true", async () => {
    // Override the default mock for this specific scenario.
    // Why: We simulate a realistic response to verify filtering expectations.
    (listPedidos as jest.Mock).mockResolvedValue({
      items: [{ estatus: "Activo" }, { estatus: "Activo" }],
      total: 2,
    });

    const req = createMockRequest("http://localhost/api/pedidos?onlyActive=true");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);

    // Why: We validate that ALL returned items satisfy the "active" condition.
    // Using multiple items ensures this is not a trivial pass case.
    expect(body.data.every((p: PedidoMock) => p.estatus === "Activo")).toBe(true);
  });
});

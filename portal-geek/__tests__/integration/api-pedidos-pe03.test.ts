/**
 * @jest-environment node
 */

import type { NextRequest } from "next/server";

import { GET } from "@/app/api/pedidos/route";
import { listPedidos } from "@/lib/services/pedidos";

const mockGetSession = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

jest.mock("@/lib/auth/guards", () => {
  const authorizeRequest =
    (allowedRoles: string[], handler: unknown) => async (req: NextRequest) => {
      const session = await mockGetSession();

      if (!session) {
        return new Response(JSON.stringify({ data: null, error: "No autenticado" }), {
          status: 401,
        });
      }

      if (!allowedRoles.includes(session.role)) {
        return new Response(
          JSON.stringify({ data: null, error: "Sin permisos para realizar esta acción" }),
          { status: 403 }
        );
      }

      return (handler as (req: NextRequest) => Promise<Response>)(req);
    };

  return {
    withRole: (roles: string[], handler: unknown) => authorizeRequest(roles, handler),

    withSection: (_section: string, _action: string, handler: unknown) =>
      authorizeRequest(["Direccion", "Colaborador"], handler),
  };
});

jest.mock("@/lib/services/pedidos", () => ({
  listPedidos: jest.fn(),
}));

const createMockRequest = (url: string): NextRequest =>
  ({
    url,
    nextUrl: new URL(url),
    cookies: {
      get: jest.fn(),
    },
  }) as unknown as NextRequest;

describe("GET /api/pedidos - PE-03 service filtering", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    (listPedidos as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
    });
  });

  it("returns 401 when there is no active session", async () => {
    mockGetSession.mockResolvedValue(null);

    const req = createMockRequest("http://localhost/api/pedidos?page=1&pageSize=10&serviceId=1");

    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(listPedidos).not.toHaveBeenCalled();
  });

  it("returns 403 when the user role is not allowed", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Cliente" });

    const req = createMockRequest("http://localhost/api/pedidos?page=1&pageSize=10&serviceId=1");

    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(listPedidos).not.toHaveBeenCalled();
  });

  it("returns 200 and forwards a valid serviceId filter to the service", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?page=1&pageSize=10&serviceId=1");

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(listPedidos).toHaveBeenCalledWith(1, 10, [1], [], false, null, null, null);
  });

  it("allows Colaborador to filter pedidos by serviceId", async () => {
    mockGetSession.mockResolvedValue({ id: 2, role: "Colaborador" });

    const req = createMockRequest("http://localhost/api/pedidos?page=1&pageSize=10&serviceId=1");

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(listPedidos).toHaveBeenCalledWith(1, 10, [1], [], false, null, null, null);
  });

  it("supports multiple serviceId filters", async () => {
    const req = createMockRequest(
      "http://localhost/api/pedidos?page=1&pageSize=10&serviceId=1&serviceId=2"
    );

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(listPedidos).toHaveBeenCalledWith(1, 10, [1, 2], [], false, null, null, null);
  });

  it("returns 422 when serviceId is not a number", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=abc");

    const res = await GET(req);

    expect(res.status).toBe(422);
    expect(listPedidos).not.toHaveBeenCalled();
  });

  it("returns 422 when serviceId is negative", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=-1");

    const res = await GET(req);

    expect(res.status).toBe(422);
    expect(listPedidos).not.toHaveBeenCalled();
  });

  it("returns 422 when serviceId is zero", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=0");

    const res = await GET(req);

    expect(res.status).toBe(422);
    expect(listPedidos).not.toHaveBeenCalled();
  });

  it("returns service status summary in the response payload", async () => {
    (listPedidos as jest.Mock).mockResolvedValue({
      items: [
        {
          id_pedido: 1,
          serviceStatusSummary: {
            Pendiente: 1,
            "En producción": 2,
            Finalizado: 0,
            Entregado: 0,
            Cancelado: 0,
          },
        },
      ],
      total: 1,
    });

    const req = createMockRequest("http://localhost/api/pedidos?page=1&pageSize=10");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data[0].serviceStatusSummary).toEqual({
      Pendiente: 1,
      "En producción": 2,
      Finalizado: 0,
      Entregado: 0,
      Cancelado: 0,
    });
  });
});

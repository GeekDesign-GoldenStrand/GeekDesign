import type { NextRequest } from "next/server";

import { GET } from "@/app/api/pedidos/route";
import { getSession } from "@/lib/auth/session";
import { listPedidos } from "@/lib/services/pedidos";

interface PedidoMock {
  estatus: string;
}

// Mock auth guard
jest.mock("@/lib/auth/guards", () => ({
  withRole: (_roles: string[], handler: unknown) => handler as (req: Request) => Promise<Response>,
}));

// Mock service layer
jest.mock("@/lib/services/pedidos", () => ({
  listPedidos: jest.fn(),
}));

beforeEach(() => {
  (listPedidos as jest.Mock).mockResolvedValue({
    items: [],
    total: 0,
  });
});

// Minimal mock of NextRequest
const createMockRequest = (url: string): NextRequest =>
  ({
    url,
    nextUrl: new URL(url),
    cookies: {
      get: jest.fn(),
    },
  }) as unknown as NextRequest;

describe("GET /api/pedidos", () => {
  it("retorna 200 con serviceId válido", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=1");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("retorna 422 con serviceId negativo", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=-1");
    const res = await GET(req);
    expect(res.status).toBe(422);
  });

  it("retorna 422 con serviceId NaN", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=abc");
    const res = await GET(req);
    expect(res.status).toBe(422);
  });

  it("retorna solo activos con onlyActive=true", async () => {
    (listPedidos as jest.Mock).mockResolvedValue({
      items: [{ estatus: "Activo" }, { estatus: "Activo" }],
      total: 2,
    });

    const req = createMockRequest("http://localhost/api/pedidos?onlyActive=true");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect((body.data as PedidoMock[]).every((p) => p.estatus === "Activo")).toBe(true);
  });
});

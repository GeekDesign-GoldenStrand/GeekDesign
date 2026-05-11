import type { NextRequest } from "next/server";

import { GET } from "@/app/api/pedidos/route";
import { listPedidos } from "@/lib/services/pedidos";

// Mock auth guard
jest.mock("@/lib/auth/guards", () => ({
  withRole: (_roles: string[], handler: unknown) => handler as (req: Request) => Promise<Response>,
}));

// Mock service layer
jest.mock("@/lib/services/pedidos", () => ({
  listPedidos: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();

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
  it("returns 200 with valid serviceId", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=1");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("returns 422 with negative serviceId", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=-1");
    const res = await GET(req);
    expect(res.status).toBe(422);
  });

  it("returns 422 with NaN serviceId", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=abc");
    const res = await GET(req);
    expect(res.status).toBe(422);
  });

  it("supports multiple serviceIds", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?serviceId=1&serviceId=2");
    await GET(req);
    expect(listPedidos).toHaveBeenCalledWith(1, 20, [1, 2], [], false, null, null, null);
  });

  it("passes estatus filters correctly", async () => {
    const req = createMockRequest(
      "http://localhost/api/pedidos?estatus=Pendiente&estatus=Finalizado"
    );
    await GET(req);
    expect(listPedidos).toHaveBeenCalledWith(
      1,
      20,
      [],
      ["Pendiente", "Finalizado"],
      false,
      null,
      null,
      null
    );
  });

  it("passes search filter correctly", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?search=Geek");
    await GET(req);
    expect(listPedidos).toHaveBeenCalledWith(1, 20, [], [], false, null, null, "Geek");
  });

  it("passes empresa and cliente filters correctly", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?empresa=GeekDesign&cliente=Jorge");
    await GET(req);
    expect(listPedidos).toHaveBeenCalledWith(1, 20, [], [], false, "GeekDesign", "Jorge", null);
  });

  it("uses default pagination values", async () => {
    const req = createMockRequest("http://localhost/api/pedidos");
    await GET(req);
    expect(listPedidos).toHaveBeenCalledWith(1, 20, [], [], false, null, null, null);
  });

  it("applies custom pagination values", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?page=2&pageSize=50");
    await GET(req);
    expect(listPedidos).toHaveBeenCalledWith(2, 50, [], [], false, null, null, null);
  });

  it("caps pageSize at 100", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?pageSize=999");
    await GET(req);
    expect(listPedidos).toHaveBeenCalledWith(1, 100, [], [], false, null, null, null);
  });

  it("forces minimum page value to 1", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?page=-5");
    await GET(req);
    expect(listPedidos).toHaveBeenCalledWith(1, 20, [], [], false, null, null, null);
  });

  it("passes onlyActive=true correctly", async () => {
    const req = createMockRequest("http://localhost/api/pedidos?onlyActive=true");
    await GET(req);
    expect(listPedidos).toHaveBeenCalledWith(1, 20, [], [], true, null, null, null);
  });
});

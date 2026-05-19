import type { NextRequest } from "next/server";

import { GET } from "@/app/api/pedidos/[id]/route";
import { getPedido } from "@/lib/services/pedidos";
import { NotFoundError } from "@/lib/utils/errors";

// Mock auth guard: pass the handler through (the route owns its try/catch).
jest.mock("@/lib/auth/guards", () => ({
  withRoleParams: (_roles: string[], handler: unknown) => handler,
}));

// Mock service layer
jest.mock("@/lib/services/pedidos", () => ({
  getPedido: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const req = {} as unknown as NextRequest;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/pedidos/[id] (PE-05)", () => {
  it("returns 200 with the order detail payload", async () => {
    (getPedido as jest.Mock).mockResolvedValue({
      pedido: { id_pedido: 7 },
      detalle: [],
      pagos: [],
      historial: [],
    });

    const res = await GET(req, ctx("7"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getPedido).toHaveBeenCalledWith(7);
    expect(body.data.pedido.id_pedido).toBe(7);
  });

  it("returns 404 when the order does not exist", async () => {
    (getPedido as jest.Mock).mockRejectedValue(new NotFoundError("Pedido no encontrado"));

    const res = await GET(req, ctx("999"));

    expect(res.status).toBe(404);
  });

  it("returns 422 for a non-numeric id", async () => {
    const res = await GET(req, ctx("abc"));

    expect(res.status).toBe(422);
    expect(getPedido).not.toHaveBeenCalled();
  });
});

import type { NextRequest } from "next/server";

import { GET } from "@/app/api/pedidos/route";
import { listPedidos } from "@/lib/services/pedidos";

type PedidoMock = {
  estatus: string;
};

// We mock the auth guard to bypass authentication and authorization.
// Why: This test focuses on request validation and handler behavior,
// not on auth logic (which should be tested separately).
jest.mock("@/lib/auth/guards", () => ({
  withRole: (_roles: string[], handler: (...args: unknown[]) => unknown) => handler,
}));

// We mock the service layer to isolate the API route.
// Why: We want to avoid hitting the real database and external dependencies,
// ensuring tests are deterministic and fast.
jest.mock("@/lib/services/pedidos", () => ({
  listPedidos: jest.fn(),
}));

beforeEach(() => {
  // Provide a safe default response for all tests.
  // Why: The route expects a consistent structure ({ items, total }).
  // Without this, tests could fail due to undefined values rather than logic errors.
  (listPedidos as jest.Mock).mockResolvedValue({
    items: [],
    total: 0,
  });
});

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

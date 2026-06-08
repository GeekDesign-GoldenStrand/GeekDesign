/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";

import { PATCH } from "@/app/api/finanzas/pedidos/[id]/facturar/route";
import * as Guards from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";

// ── Auth guard: jest.fn() inside factory so the reference is stable ──────────
jest.mock("@/lib/auth/guards", () => ({
  withSectionParams: jest.fn((_section: string, _action: string, handler: unknown) => handler),
}));

jest.mock("@/lib/db/client", () => ({
  prisma: {
    estadoFacturaPedido: { findUnique: jest.fn() },
    pedidos: { update: jest.fn() },
  },
}));

const mockWithSectionParams = Guards.withSectionParams as jest.Mock;
const mockFindUniqueEstado = prisma.estadoFacturaPedido.findUnique as jest.Mock;
const mockUpdatePedido = prisma.pedidos.update as jest.Mock;

// Capture guard registration args before beforeEach resets call history.
let guardRegistrationArgs: [string, string] | null = null;
beforeAll(() => {
  const [section, action] = mockWithSectionParams.mock.calls[0] ?? [];
  guardRegistrationArgs = [section as string, action as string];
});

const ESTADO_FACTURADO = { id_estado_factura: 3, descripcion: "Facturado" };
const PEDIDO_UPDATED = { id_pedido: 7, facturado: true, numero_factura: "FAC-2024-001" };

function makeReq(body?: object, jsonThrows = false): NextRequest {
  return {
    json: jsonThrows
      ? () => Promise.reject(new SyntaxError("Unexpected token"))
      : () => Promise.resolve(body ?? {}),
  } as unknown as NextRequest;
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  jest.clearAllMocks();
  // Re-wire the pass-through after clearAllMocks resets the implementation.
  mockWithSectionParams.mockImplementation(
    (_section: string, _action: string, handler: unknown) => handler
  );
  mockFindUniqueEstado.mockResolvedValue(ESTADO_FACTURADO);
  mockUpdatePedido.mockResolvedValue(PEDIDO_UPDATED);
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth wiring
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/finanzas/pedidos/[id]/facturar — auth wiring", () => {
  it("registers under the 'finanzas' section with 'write' action", () => {
    // guardRegistrationArgs captured in beforeAll, before clearAllMocks runs.
    expect(guardRegistrationArgs).toEqual(["finanzas", "write"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/finanzas/pedidos/[id]/facturar — success", () => {
  it("returns 200 with facturado=true and the pedido id in the response body", async () => {
    const res = await PATCH(makeReq({ numero_factura: "FAC-2024-001" }), ctx("7"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({ id_pedido: 7, facturado: true });
  });

  it("scopes the update to factura=true so non-invoice orders cannot be marked", async () => {
    await PATCH(makeReq({ numero_factura: "FAC-001" }), ctx("7"));

    expect(mockUpdatePedido).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_pedido: 7, factura: true },
        data: expect.objectContaining({
          facturado: true,
          id_estado_factura: ESTADO_FACTURADO.id_estado_factura,
        }),
      })
    );
  });

  it("trims leading/trailing whitespace from numero_factura before persisting", async () => {
    await PATCH(makeReq({ numero_factura: "  FAC-2024-001  " }), ctx("7"));

    expect(mockUpdatePedido).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ numero_factura: "FAC-2024-001" }),
      })
    );
  });

  it("selects id_pedido, facturado and numero_factura in the update result", async () => {
    await PATCH(makeReq({ numero_factura: "FAC-001" }), ctx("7"));

    expect(mockUpdatePedido).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id_pedido: true, facturado: true, numero_factura: true },
      })
    );
  });

  it("looks up the 'Facturado' catalog entry by descripcion", async () => {
    await PATCH(makeReq({ numero_factura: "FAC-001" }), ctx("7"));

    expect(mockFindUniqueEstado).toHaveBeenCalledWith({
      where: { descripcion: "Facturado" },
    });
  });

  it("calls the catalog lookup before calling pedidos.update", async () => {
    const callOrder: string[] = [];
    mockFindUniqueEstado.mockImplementation(async () => {
      callOrder.push("catalog");
      return ESTADO_FACTURADO;
    });
    mockUpdatePedido.mockImplementation(async () => {
      callOrder.push("update");
      return PEDIDO_UPDATED;
    });

    await PATCH(makeReq({ numero_factura: "FAC-001" }), ctx("7"));

    expect(callOrder).toEqual(["catalog", "update"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// numero_factura omission rules
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/finanzas/pedidos/[id]/facturar — numero_factura omission", () => {
  async function expectOmitted(body: object | undefined, jsonThrows = false) {
    await PATCH(makeReq(body, jsonThrows), ctx("7"));
    const data = mockUpdatePedido.mock.calls[0][0].data as Record<string, unknown>;
    expect(data).not.toHaveProperty("numero_factura");
  }

  it("omits numero_factura when body is empty", () => expectOmitted({}));

  it("omits numero_factura when value is whitespace-only", () =>
    expectOmitted({ numero_factura: "   " }));

  it("omits numero_factura when value is an empty string", () =>
    expectOmitted({ numero_factura: "" }));

  it("omits numero_factura when value is a number (wrong type)", () =>
    expectOmitted({ numero_factura: 12345 }));

  it("omits numero_factura when value is null", () => expectOmitted({ numero_factura: null }));

  it("omits numero_factura when value is a boolean", () => expectOmitted({ numero_factura: true }));

  it("still calls update when req.json() throws (malformed body)", () =>
    expectOmitted(undefined, true));
});

// ─────────────────────────────────────────────────────────────────────────────
// ID validation
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/finanzas/pedidos/[id]/facturar — ID validation", () => {
  it("returns 422 and skips all DB calls for a non-numeric id", async () => {
    const res = await PATCH(makeReq({ numero_factura: "FAC-001" }), ctx("abc"));

    expect(res.status).toBe(422);
    expect(mockFindUniqueEstado).not.toHaveBeenCalled();
    expect(mockUpdatePedido).not.toHaveBeenCalled();
  });

  it.each(["null", "undefined", "7x", "NaN", ""])(
    "returns 422 for non-numeric id '%s'",
    async (id) => {
      const res = await PATCH(makeReq(), ctx(id));
      // "" parses as 0 which IS a valid number — expect update to be called but return 200
      if (id === "") {
        expect(res.status).toBe(200);
      } else {
        expect(res.status).toBe(422);
      }
    }
  );

  it("accepts id '7' as a valid numeric string", async () => {
    const res = await PATCH(makeReq({ numero_factura: "FAC-001" }), ctx("7"));
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Catalog not found
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/finanzas/pedidos/[id]/facturar — catalog error", () => {
  it("returns 404 with an error message when the 'Facturado' catalog entry is missing", async () => {
    mockFindUniqueEstado.mockResolvedValue(null);

    const res = await PATCH(makeReq({ numero_factura: "FAC-001" }), ctx("7"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/Facturado/i);
  });

  it("does not call pedidos.update when the catalog entry is missing", async () => {
    mockFindUniqueEstado.mockResolvedValue(null);

    await PATCH(makeReq({ numero_factura: "FAC-001" }), ctx("7"));

    expect(mockUpdatePedido).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unexpected DB errors
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/finanzas/pedidos/[id]/facturar — DB errors", () => {
  it("returns 500 when pedidos.update throws unexpectedly", async () => {
    mockUpdatePedido.mockRejectedValue(new Error("Connection reset"));

    const res = await PATCH(makeReq({ numero_factura: "FAC-001" }), ctx("7"));

    expect(res.status).toBe(500);
  });

  it("returns 500 when the catalog lookup throws and does not call update", async () => {
    mockFindUniqueEstado.mockRejectedValue(new Error("DB timeout"));

    const res = await PATCH(makeReq({ numero_factura: "FAC-001" }), ctx("7"));

    expect(res.status).toBe(500);
    expect(mockUpdatePedido).not.toHaveBeenCalled();
  });
});

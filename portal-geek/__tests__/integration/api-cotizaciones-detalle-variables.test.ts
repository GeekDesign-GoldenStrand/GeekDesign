/**
 * @jest-environment node
 */

import type { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";

import { createApp } from "../helpers/next-supertest";

// ── Auth mocks ────────────────────────────────────────────────────────────────
const mockGetSession = jest.fn();

type Handler = (req: Request, ctx: { params: unknown }, session?: unknown) => Promise<Response>;

jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

jest.mock("@/lib/auth/guards", () => {
  const buildGuard =
    (allowedRoles: string[], handler: Handler) =>
    async (req: Request, ctx: { params: unknown }) => {
      const session = await getSession();

      if (!session) {
        return new Response(JSON.stringify({ data: null, error: "No autenticado" }), {
          status: 401,
        });
      }

      const effectiveRole =
        (session as { role: string }).role === "Administrador"
          ? "Direccion"
          : (session as { role: string }).role;

      if (!allowedRoles.includes(effectiveRole)) {
        return new Response(
          JSON.stringify({ data: null, error: "Sin permisos para realizar esta acción" }),
          { status: 403 }
        );
      }

      return handler(req, ctx, session);
    };

  return {
    withRoleParams: (roles: string[], handler: Handler) => buildGuard(roles, handler),
    withSectionParams: (_section: string, action: "read" | "write", handler: Handler) => {
      const allowedRoles =
        action === "read" ? ["Direccion", "Ventas", "Produccion"] : ["Direccion"];
      return buildGuard(allowedRoles, handler);
    },
  };
});

// ── Pricing mock ──────────────────────────────────────────────────────────────
// updateDetalleVariables delegates recomputation to calcularPrecioServicio,
// which has its own Prisma fan-out. Mocking the function directly keeps the
// route test focused on the orchestration layer (guards, IDOR, ownership,
// monto_total recompute) without re-asserting pricing math here — that has
// its own unit coverage.
const mockCalcular = jest.fn();

jest.mock("@/lib/services/formula-pricing", () => ({
  calcularPrecioServicio: (input: unknown) => mockCalcular(input),
}));

// ── DB mock ───────────────────────────────────────────────────────────────────
// Shape mirrors what updateDetalleVariables touches inside the $transaction:
//   - cotizaciones.findUnique → guard + porcentaje_descuento + id_pedido
//   - detallePedido.findUnique → IDOR + servicio/material/cantidad
//   - formulas.findFirst → formula.variables for id_variable validation
//   - variablesCotizacion.findMany → existing values (for unedited vars)
//   - variablesCotizacion.deleteMany + createMany → atomic replace
//   - detallePedido.update → precio_unitario + subtotal
//   - detallePedido.findMany → sum subtotales for monto_total
//   - cotizaciones.update → monto_total
type TxCtx = {
  cotizaciones: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  detallePedido: {
    findUnique: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
  };
  formulas: { findFirst: jest.Mock };
  variablesCotizacion: {
    findMany: jest.Mock;
    deleteMany: jest.Mock;
    createMany: jest.Mock;
  };
};

const txMocks = {
  cotizacion: {
    id_cotizacion: 1,
    id_pedido: 10,
    porcentaje_descuento: null as string | null,
    estatus: { descripcion: "Pendiente" as string },
  },
  detalle: {
    id_detalle: 5,
    id_pedido: 10,
    id_servicio: 7,
    id_material: 3,
    cantidad: 4,
  } as null | {
    id_detalle: number;
    id_pedido: number;
    id_servicio: number;
    id_material: number;
    cantidad: number;
  },
  formulaVariables: [
    {
      id_variable: 100,
      nombre_variable: "ancho",
      valor_default: "10",
    },
    {
      id_variable: 101,
      nombre_variable: "alto",
      valor_default: "20",
    },
  ],
};

function buildTx(): TxCtx {
  return {
    cotizaciones: {
      findUnique: jest.fn().mockResolvedValue(
        txMocks.cotizacion === null
          ? null
          : {
              id_cotizacion: txMocks.cotizacion.id_cotizacion,
              id_pedido: txMocks.cotizacion.id_pedido,
              porcentaje_descuento: txMocks.cotizacion.porcentaje_descuento,
              estatus: txMocks.cotizacion.estatus,
            }
      ),
      update: jest.fn().mockImplementation(({ data }) => ({ id_cotizacion: 1, ...data })),
    },
    detallePedido: {
      findUnique: jest.fn().mockResolvedValue(txMocks.detalle),
      update: jest.fn().mockImplementation(({ data }) => ({
        id_detalle: 5,
        precio_unitario: data.precio_unitario,
        subtotal: data.subtotal,
      })),
      // After the update, sum-of-subtotales for monto_total recompute.
      findMany: jest.fn().mockResolvedValue([{ subtotal: "200.00" }, { subtotal: "150.00" }]),
    },
    formulas: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ id_formula: 1, variables: txMocks.formulaVariables }),
    },
    variablesCotizacion: {
      findMany: jest.fn().mockResolvedValue([
        { id_variable: 100, valor: "12" },
        { id_variable: 101, valor: "25" },
      ]),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
async function call(body: unknown, params = { id: "1", id_detalle: "5" }) {
  const mod = await import("@/app/api/cotizaciones/[id]/detalles/[id_detalle]/variables/route");
  const handler = (req: unknown) =>
    mod.PATCH(req as NextRequest, { params: Promise.resolve(params) });
  return createApp({ PATCH: handler })
    .patch(`/api/cotizaciones/${params.id}/detalles/${params.id_detalle}/variables`)
    .send(body);
}

function resetTxMockToDefaults() {
  txMocks.cotizacion = {
    id_cotizacion: 1,
    id_pedido: 10,
    porcentaje_descuento: null,
    estatus: { descripcion: "Pendiente" },
  };
  txMocks.detalle = {
    id_detalle: 5,
    id_pedido: 10,
    id_servicio: 7,
    id_material: 3,
    cantidad: 4,
  };
}

beforeEach(async () => {
  jest.clearAllMocks();
  resetTxMockToDefaults();

  mockGetSession.mockResolvedValue({ id: 42, role: "Direccion" });
  mockCalcular.mockResolvedValue(50); // default precio_unitario

  const { prisma } = await import("@/lib/db/client");
  (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(buildTx()));
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("PATCH /api/cotizaciones/[id]/detalles/[id_detalle]/variables", () => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  it("returns 401 without an active session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await call({ variables: [{ id_variable: 100, valor: 15 }] });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-Direccion role", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });
    const res = await call({ variables: [{ id_variable: 100, valor: 15 }] });
    expect(res.status).toBe(403);
  });

  it("accepts the Administrador role (alias of Direccion)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    const res = await call({ variables: [{ id_variable: 100, valor: 15 }] });
    expect(res.status).toBe(200);
  });

  // ── Validation ────────────────────────────────────────────────────────────
  it("returns 422 when variables is empty", async () => {
    const res = await call({ variables: [] });
    expect(res.status).toBe(422);
  });

  it("returns 422 when a variable valor is not positive", async () => {
    const res = await call({ variables: [{ id_variable: 100, valor: 0 }] });
    expect(res.status).toBe(422);
  });

  it("returns 422 when a variable valor exceeds the upper bound (100000)", async () => {
    const res = await call({ variables: [{ id_variable: 100, valor: 100001 }] });
    expect(res.status).toBe(422);
  });

  it("returns 422 when id_detalle param is not a number", async () => {
    const res = await call(
      { variables: [{ id_variable: 100, valor: 15 }] },
      { id: "1", id_detalle: "abc" }
    );
    expect(res.status).toBe(422);
  });

  // ── Domain guards ─────────────────────────────────────────────────────────
  it("returns 404 when the cotización doesn't exist", async () => {
    txMocks.cotizacion = null as unknown as typeof txMocks.cotizacion;
    const { prisma } = await import("@/lib/db/client");
    (prisma.$transaction as jest.Mock).mockImplementationOnce((fn) => fn(buildTx()));

    const res = await call({ variables: [{ id_variable: 100, valor: 15 }] });
    expect(res.status).toBe(404);
  });

  it("returns 409 when the cotización is not Pendiente", async () => {
    txMocks.cotizacion.estatus.descripcion = "Validada";
    const { prisma } = await import("@/lib/db/client");
    (prisma.$transaction as jest.Mock).mockImplementationOnce((fn) => fn(buildTx()));

    const res = await call({ variables: [{ id_variable: 100, valor: 15 }] });
    expect(res.status).toBe(409);
  });

  it("returns 404 when the detalle doesn't belong to the cotización's pedido (IDOR guard)", async () => {
    txMocks.detalle = {
      id_detalle: 5,
      id_pedido: 999, // belongs to a different pedido
      id_servicio: 7,
      id_material: 3,
      cantidad: 4,
    };
    const { prisma } = await import("@/lib/db/client");
    (prisma.$transaction as jest.Mock).mockImplementationOnce((fn) => fn(buildTx()));

    const res = await call({ variables: [{ id_variable: 100, valor: 15 }] });
    expect(res.status).toBe(404);
  });

  it("returns 422 when an id_variable doesn't belong to the formula", async () => {
    const res = await call({
      variables: [{ id_variable: 999, valor: 15 }], // not in formula
    });
    expect(res.status).toBe(422);
  });

  // ── Success path ─────────────────────────────────────────────────────────
  it("calls calcularPrecioServicio with id_servicio, id_material, and the merged variables", async () => {
    await call({ variables: [{ id_variable: 100, valor: 33 }] });

    expect(mockCalcular).toHaveBeenCalledTimes(1);
    const arg = mockCalcular.mock.calls[0][0];
    expect(arg.id_servicio).toBe(7);
    expect(arg.id_material).toBe(3);
    // Edited variable wins; the other comes from the existing VariablesCotizacion row.
    expect(arg.variables).toEqual(
      expect.arrayContaining([
        { nombre_variable: "ancho", valor: 33 },
        { nombre_variable: "alto", valor: 25 },
      ])
    );
  });

  it("persists the recomputed precio_unitario and subtotal in the same transaction", async () => {
    mockCalcular.mockResolvedValueOnce(75);

    const captured: { tx?: TxCtx } = {};
    const { prisma } = await import("@/lib/db/client");
    (prisma.$transaction as jest.Mock).mockImplementationOnce((fn) => {
      const tx = buildTx();
      captured.tx = tx;
      return fn(tx);
    });

    const res = await call({ variables: [{ id_variable: 100, valor: 12 }] });

    expect(res.status).toBe(200);
    expect(captured.tx!.detallePedido.update).toHaveBeenCalledWith({
      where: { id_detalle: 5 },
      data: { precio_unitario: 75, subtotal: 300 }, // 75 × cantidad(4) = 300
    });
  });

  it("replaces only the variables actually edited (leaves untouched audit rows alone)", async () => {
    const captured: { tx?: TxCtx } = {};
    const { prisma } = await import("@/lib/db/client");
    (prisma.$transaction as jest.Mock).mockImplementationOnce((fn) => {
      const tx = buildTx();
      captured.tx = tx;
      return fn(tx);
    });

    await call({ variables: [{ id_variable: 100, valor: 33 }] });

    expect(captured.tx!.variablesCotizacion.deleteMany).toHaveBeenCalledWith({
      where: { id_cotizacion: 1, id_detalle: 5, id_variable: { in: [100] } },
    });
    expect(captured.tx!.variablesCotizacion.createMany).toHaveBeenCalledWith({
      data: [
        {
          id_cotizacion: 1,
          id_detalle: 5,
          id_variable: 100,
          valor: 33,
          id_usuario_asigno: 42,
        },
      ],
    });
  });

  it("recomputes monto_total without discount when porcentaje_descuento is null", async () => {
    const captured: { tx?: TxCtx } = {};
    const { prisma } = await import("@/lib/db/client");
    (prisma.$transaction as jest.Mock).mockImplementationOnce((fn) => {
      const tx = buildTx();
      captured.tx = tx;
      return fn(tx);
    });

    await call({ variables: [{ id_variable: 100, valor: 15 }] });

    // detallePedido.findMany mock returns subtotales 200 + 150 = 350
    expect(captured.tx!.cotizaciones.update).toHaveBeenCalledWith({
      where: { id_cotizacion: 1 },
      data: { monto_total: 350 },
    });
  });

  it("applies the stored porcentaje_descuento when recomputing monto_total", async () => {
    txMocks.cotizacion.porcentaje_descuento = "10"; // 10% off
    const captured: { tx?: TxCtx } = {};
    const { prisma } = await import("@/lib/db/client");
    (prisma.$transaction as jest.Mock).mockImplementationOnce((fn) => {
      const tx = buildTx();
      captured.tx = tx;
      return fn(tx);
    });

    await call({ variables: [{ id_variable: 100, valor: 15 }] });

    // (200 + 150) × (1 − 0.10) = 315
    expect(captured.tx!.cotizaciones.update).toHaveBeenCalledWith({
      where: { id_cotizacion: 1 },
      data: { monto_total: 315 },
    });
  });

  it("returns 200 with the updated detalle and monto_total payload", async () => {
    mockCalcular.mockResolvedValueOnce(42);

    const res = await call({ variables: [{ id_variable: 100, valor: 15 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.detalle).toEqual(
      expect.objectContaining({ precio_unitario: 42, subtotal: 168 }) // 42×4
    );
    expect(res.body.data.monto_total).toBe(350);
  });

  it("records the session user as id_usuario_asigno on the new VariablesCotizacion rows", async () => {
    mockGetSession.mockResolvedValue({ id: 77, role: "Direccion" });

    const captured: { tx?: TxCtx } = {};
    const { prisma } = await import("@/lib/db/client");
    (prisma.$transaction as jest.Mock).mockImplementationOnce((fn) => {
      const tx = buildTx();
      captured.tx = tx;
      return fn(tx);
    });

    await call({ variables: [{ id_variable: 100, valor: 15 }] });

    expect(captured.tx!.variablesCotizacion.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ id_usuario_asigno: 77 })],
    });
  });
});

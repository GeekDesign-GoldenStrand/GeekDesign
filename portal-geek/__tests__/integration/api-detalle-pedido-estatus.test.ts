/**
 * @jest-environment node
 */

import type { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";
import { changeDetallePedidoStatus } from "@/lib/services/pedidos";
import { NotFoundError } from "@/lib/utils/errors";

type Handler = (
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
  session?: { id: number; role: string }
) => Promise<Response>;

const mockGetSession = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

jest.mock("@/lib/auth/guards", () => ({
  withRoleParams:
    (roles: string[], handler: Handler) =>
    async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
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

jest.mock("@/lib/services/pedidos", () => ({
  PEDIDO_STATUS: {
    PENDIENTE: "Pendiente",
    EN_PRODUCCION: "En producción",
    FINALIZADO: "Finalizado",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
  },
  changeDetallePedidoStatus: jest.fn(),
}));

const createMockRequest = (body: unknown): NextRequest =>
  ({
    json: async () => body,
    cookies: {
      get: jest.fn(),
    },
  }) as unknown as NextRequest;

describe("PATCH /api/pedidos/detalles/[id]/estatus", () => {
  let PATCH: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import("@/app/api/pedidos/detalles/[id]/estatus/route");
    PATCH = mod.PATCH;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    (changeDetallePedidoStatus as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_estatus: 2,
    });
  });

  it("returns 401 without session", async () => {
    mockGetSession.mockResolvedValue(null);

    const req = createMockRequest({ estatus: "En producción" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(401);
    expect(changeDetallePedidoStatus).not.toHaveBeenCalled();
  });

  it("returns 403 with unauthorized role", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Finanzas" });

    const req = createMockRequest({ estatus: "En producción" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(403);
    expect(changeDetallePedidoStatus).not.toHaveBeenCalled();
  });

  it("allows Direccion to update detail status and forwards user id for audit", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const req = createMockRequest({ estatus: "En producción" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id_detalle).toBe(1);
    expect(changeDetallePedidoStatus).toHaveBeenCalledWith(1, "En producción", 1);
  });

  it("allows Colaborador to update detail status and forwards user id for audit", async () => {
    mockGetSession.mockResolvedValue({ id: 2, role: "Colaborador" });

    const req = createMockRequest({ estatus: "Finalizado" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(200);
    expect(changeDetallePedidoStatus).toHaveBeenCalledWith(1, "Finalizado", 2);
  });

  it("returns 422 with invalid detail id", async () => {
    const req = createMockRequest({ estatus: "En producción" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "abc" }) });

    expect(res.status).toBe(422);
    expect(changeDetallePedidoStatus).not.toHaveBeenCalled();
  });

  it("returns 422 with invalid status", async () => {
    const req = createMockRequest({ estatus: "Activo" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(422);
    expect(changeDetallePedidoStatus).not.toHaveBeenCalled();
  });

  it("returns 404 when detalle pedido does not exist", async () => {
    (changeDetallePedidoStatus as jest.Mock).mockRejectedValue(
      new NotFoundError("Detalle de pedido not found")
    );

    const req = createMockRequest({ estatus: "En producción" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "999" }) });

    expect(res.status).toBe(404);
  });

  it("returns 500 when service layer throws an unexpected error", async () => {
    (changeDetallePedidoStatus as jest.Mock).mockRejectedValue(new Error("Database error"));

    const req = createMockRequest({ estatus: "En producción" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(500);
  });
});

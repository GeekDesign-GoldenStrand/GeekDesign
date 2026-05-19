/**
 * @jest-environment node
 */

import { prisma } from "@/lib/db/client";

import type { NextRouteHandler } from "../helpers/next-supertest";
import { createApp } from "../helpers/next-supertest";

// Mock implementation of prisma for integration testing
jest.mock("@/lib/db/client", () => ({
  prisma: {
    cotizaciones: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    estatusCotizacion: {
      findUnique: jest.fn(),
    },
    estatusPedidos: {
      findUnique: jest.fn(),
    },
    estadoFacturaPedido: {
      findUnique: jest.fn(),
    },
    pedidos: {
      update: jest.fn(),
    },
    detallePedido: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    historialEstadosPedidos: {
      deleteMany: jest.fn(),
    },
    historialEstadosCotizacion: {
      create: jest.fn(),
    },
    cotizacionesRechazadas: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
  },
}));

// Mock auth to avoid jose/ESM issues
const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

// KIKW12 review #1b: approve/cancel are gated by a magic-link session cookie.
// Mock the verifier so tests can simulate authorized/unauthorized requests
// without minting real JWTs (and without pulling jose into the jest env).
const mockVerifySessionFor = jest.fn();
jest.mock("@/lib/services/cotizacion-access", () => ({
  SESSION_COOKIE_NAME: "cotizacion_session",
  verifySessionFor: (...args: unknown[]) => mockVerifySessionFor(...args),
}));

const paramExtractor = (url: URL) => {
  const parts = url.pathname.split("/");
  return { id: parts[3] };
};

describe("Req. ST-08-09 Integration Tests", () => {
  let detailGET: NextRouteHandler;
  let approvePOST: NextRouteHandler;
  let cancelPOST: NextRouteHandler;

  beforeAll(async () => {
    // Dynamic imports to ensure mocks are respected
    const detailMod = await import("@/app/api/cotizaciones/[id]/route");
    const approveMod = await import("@/app/api/cotizaciones/[id]/approve/route");
    const cancelMod = await import("@/app/api/cotizaciones/[id]/cancel/route");

    detailGET = detailMod.GET as unknown as NextRouteHandler;
    approvePOST = approveMod.POST as unknown as NextRouteHandler;
    cancelPOST = cancelMod.POST as unknown as NextRouteHandler;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    // Default: cliente session cookie is valid for whichever cotización is hit.
    mockVerifySessionFor.mockResolvedValue(true);
  });

  describe("Phase 1: GET /api/cotizaciones/[folio]", () => {
    it("should return 200 and the quotation details when found", async () => {
      const mockQuote = {
        id_cotizacion: 203,
        folio: "COT-203",
        id_cliente: 1,
        monto_total: 1500,
        estatus: { descripcion: "Validada" },
        cliente: { nombre_cliente: "Test User" },
        variablesCotizacion: [],
      };

      (prisma.cotizaciones.findUnique as jest.Mock).mockResolvedValue(mockQuote);

      const res = await createApp({ GET: detailGET }, paramExtractor)
        .get("/api/cotizaciones/203")
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.id_cotizacion).toBe(203);
    });

    it("should return 404 when folio is not found", async () => {
      (prisma.cotizaciones.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await createApp({ GET: detailGET }, paramExtractor)
        .get("/api/cotizaciones/999")
        .send();

      expect(res.status).toBe(404);
    });

    it("should return 401 when no session is present", async () => {
      mockGetSession.mockResolvedValue(null);

      const res = await createApp({ GET: detailGET }, paramExtractor)
        .get("/api/cotizaciones/203")
        .send();

      expect(res.status).toBe(401);
    });

    it("should return 403 when user role is not Direccion", async () => {
      mockGetSession.mockResolvedValue({ id: 1, role: "Vendedor" });

      const res = await createApp({ GET: detailGET }, paramExtractor)
        .get("/api/cotizaciones/203")
        .send();

      expect(res.status).toBe(403);
    });
  });

  describe("Phase 2: POST /api/cotizaciones/[id]/approve (D5 promote-draft)", () => {
    it("D5: promotes draft pedido in place (no delete/recreate) and returns 201", async () => {
      const mockQuote = {
        id_cotizacion: 203,
        id_cliente: 1,
        id_pedido: 101,
        id_estatus_cotizacion: 2,
        estatus: { descripcion: "Validada" },
        pedido: { id_sucursal: 1 },
        cliente: { correo_electronico: "test@example.com" },
      };

      (prisma.cotizaciones.findUnique as jest.Mock).mockResolvedValue(mockQuote);
      (prisma.estatusCotizacion.findUnique as jest.Mock).mockResolvedValue({
        id_estatus: 4,
        descripcion: "Aprobada",
      });
      (prisma.estadoFacturaPedido.findUnique as jest.Mock).mockResolvedValue({
        id_estado_factura: 4,
        descripcion: "Aprobacion_diseno",
      });
      (prisma.detallePedido.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.pedidos.update as jest.Mock).mockResolvedValue({
        id_pedido: 101,
        id_estado_factura: 4,
      });
      (prisma.cotizaciones.update as jest.Mock).mockResolvedValue({
        id_cotizacion: 203,
        id_estatus_cotizacion: 4,
        id_pedido: 101,
      });

      const res = await createApp({ POST: approvePOST }, paramExtractor)
        .post("/api/cotizaciones/203/approve")
        .set("Cookie", "cotizacion_session=stub")
        .send();

      expect(res.status).toBe(201);

      // Promote in place — same id_pedido, no .create call.
      expect(prisma.pedidos.update).toHaveBeenCalledWith({
        where: { id_pedido: 101 },
        data: { id_estado_factura: 4 },
      });
      // Only rejected items are deleted, not the whole pedido.
      expect(prisma.detallePedido.deleteMany).toHaveBeenCalledWith({
        where: {
          id_pedido: 101,
          notas: { contains: "[ESTADO:rechazado]" },
        },
      });
      // History entry attributed to cliente.
      expect(prisma.historialEstadosCotizacion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_cotizacion: 203,
          actor_tipo: "Cliente",
          id_estado_nuevo: 4,
        }),
      });
    });

    it("should return 403 when the magic-link session cookie is missing", async () => {
      const res = await createApp({ POST: approvePOST }, paramExtractor)
        .post("/api/cotizaciones/203/approve")
        .send();

      expect(res.status).toBe(403);
    });

    it("should return 403 when the session cookie does not authorize this cotización", async () => {
      mockVerifySessionFor.mockResolvedValueOnce(false);
      const res = await createApp({ POST: approvePOST }, paramExtractor)
        .post("/api/cotizaciones/203/approve")
        .set("Cookie", "cotizacion_session=stub")
        .send();

      expect(res.status).toBe(403);
    });

    it("should return 409 when the quotation is already processed", async () => {
      const mockQuote = {
        id_cotizacion: 203,
        estatus: { descripcion: "Aprobada" },
        cliente: { correo_electronico: "test@example.com" },
      };

      (prisma.cotizaciones.findUnique as jest.Mock).mockResolvedValue(mockQuote);

      const res = await createApp({ POST: approvePOST }, paramExtractor)
        .post("/api/cotizaciones/203/approve")
        .set("Cookie", "cotizacion_session=stub")
        .send();

      expect(res.status).toBe(409);
    });
  });

  describe("Phase 3: POST /api/cotizaciones/[id]/cancel", () => {
    it("should successfully cancel a quotation (200)", async () => {
      const mockQuote = {
        id_cotizacion: 203,
        estatus: { descripcion: "Validada" },
        cliente: { correo_electronico: "test@example.com" },
      };

      (prisma.cotizaciones.findUnique as jest.Mock).mockResolvedValue(mockQuote);
      (prisma.estatusCotizacion.findUnique as jest.Mock).mockResolvedValue({
        id_estatus: 5,
        descripcion: "Cancelada",
      });

      const res = await createApp({ POST: cancelPOST }, paramExtractor)
        .post("/api/cotizaciones/203/cancel")
        .set("Cookie", "cotizacion_session=stub")
        .send({ reason: "Precio alto" });

      expect(res.status).toBe(200);
    });
  });
});

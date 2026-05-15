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
    pedidos: {
      create: jest.fn(),
    },
    detallePedido: {
      findMany: jest.fn(),
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

  describe("Phase 2: POST /api/cotizaciones/[id]/approve", () => {
    it("should successfully approve a quotation and create a pedido (201)", async () => {
      const mockQuote = {
        id_cotizacion: 203,
        id_cliente: 1,
        id_pedido: 101,
        id_estatus_cotizacion: 2,
        estatus: { descripcion: "Validada" },
        pedido: { id_sucursal: 1 },
      };

      const mockDetails = [
        {
          id_servicio: 1,
          id_material: 1,
          id_archivo: 1,
          cantidad: 10,
          precio_unitario: 100,
          subtotal: 1000,
          notas: "Test item",
        },
      ];

      (prisma.cotizaciones.findUnique as jest.Mock).mockResolvedValue(mockQuote);
      (prisma.estatusCotizacion.findUnique as jest.Mock).mockResolvedValue({
        id_estatus: 4,
        descripcion: "Aprobada",
      });
      (prisma.estatusPedidos.findUnique as jest.Mock).mockResolvedValue({
        id_estatus: 1,
        descripcion: "Pendiente",
      });
      (prisma.detallePedido.findMany as jest.Mock).mockResolvedValue(mockDetails);
      (prisma.pedidos.create as jest.Mock).mockResolvedValue({ id_pedido: 500 });

      const res = await createApp({ POST: approvePOST }, paramExtractor)
        .post("/api/cotizaciones/203/approve")
        .send();

      expect(res.status).toBe(201);
      expect(prisma.pedidos.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            detalles: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  cantidad: 10,
                  precio_unitario: 100,
                }),
              ]),
            },
          }),
        })
      );
    });

    it("should return 409 when the quotation is already processed", async () => {
      const mockQuote = {
        id_cotizacion: 203,
        estatus: { descripcion: "Aprobada" },
      };

      (prisma.cotizaciones.findUnique as jest.Mock).mockResolvedValue(mockQuote);

      const res = await createApp({ POST: approvePOST }, paramExtractor)
        .post("/api/cotizaciones/203/approve")
        .send();

      expect(res.status).toBe(409);
    });
  });

  describe("Phase 3: POST /api/cotizaciones/[id]/cancel", () => {
    it("should successfully cancel a quotation (200)", async () => {
      const mockQuote = {
        id_cotizacion: 203,
        estatus: { descripcion: "Validada" },
      };

      (prisma.cotizaciones.findUnique as jest.Mock).mockResolvedValue(mockQuote);
      (prisma.estatusCotizacion.findUnique as jest.Mock).mockResolvedValue({
        id_estatus: 5,
        descripcion: "Cancelada",
      });

      const res = await createApp({ POST: cancelPOST }, paramExtractor)
        .post("/api/cotizaciones/203/cancel")
        .send({ reason: "Precio alto" });

      expect(res.status).toBe(200);
    });
  });
});

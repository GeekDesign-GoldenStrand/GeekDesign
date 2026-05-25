/**
 * @jest-environment node
 *
 * Integration tests for POST /api/pedidos/[id]/orden-compra-interna.
 *
 * Strategy:
 *   • The auth guard (withRoleParams) runs for real — only getSession is mocked.
 *   • getOrderThirdParties is mocked at the service layer (already unit-tested
 *     in order-third-parties.test.ts — no need to re-exercise it here).
 *   • generatePurchaseOrderPDF / calcularTotalesOrden are mocked to avoid
 *     importing @react-pdf/renderer in the Jest environment.
 */
import { NotFoundError } from "@/lib/utils/errors";

import type { NextRouteHandler } from "../helpers/next-supertest";
import { createApp } from "../helpers/next-supertest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Session — avoids pulling jose (ESM-only) into the jest CJS transformer.
const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  SESSION_COOKIE: "gd_session",
  SESSION_MAX_AGE_SECONDS: 28800,
  getSession: () => mockGetSession(),
}));

// Service — getOrderThirdParties is already unit-tested separately.
const mockGetOrderThirdParties = jest.fn();
jest.mock("@/lib/services/pedidos", () => ({
  getOrderThirdParties: (...args: unknown[]) => mockGetOrderThirdParties(...args),
}));

// PDF utilities — avoids @react-pdf/renderer import issues in Jest.
const mockGeneratePDF = jest.fn();
const mockCalcularTotales = jest.fn();
jest.mock("@/lib/utils/pdf-purchase-order", () => ({
  generatePurchaseOrderPDF: (...args: unknown[]) => mockGeneratePDF(...args),
  calcularTotalesOrden: (...args: unknown[]) => mockCalcularTotales(...args),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SUCURSAL = {
  id_sucursal: 1,
  nombre_sucursal: "Sucursal Central",
  direccion: "Av. Principal 100",
  horario_apertura: null,
  horario_salida: null,
  estatus: "Activo",
};

const PEDIDO = {
  id_pedido: 1,
  id_cliente: 1,
  id_estatus: 1,
  id_sucursal: 1,
  id_estado_factura: null,
  fecha_creacion: new Date("2026-01-01"),
  fecha_fin: null,
  fecha_estimada: null,
  factura: false,
  facturado: false,
  numero_factura: null,
  notas: null,
  cliente: {
    id_cliente: 1,
    nombre_cliente: "Cliente Test",
    empresa: null,
    rfc: null,
    correo_electronico: "test@test.com",
    numero_telefono: "5551234567",
    categoria: null,
  },
  sucursal: SUCURSAL,
};

const PROVEEDOR = {
  id_proveedor: 10,
  nombre_proveedor: "Proveedor Test",
  apodo: null,
  tipo: "Proveedor de material",
  telefono: "5559876543",
  correo: "proveedor@test.com",
  descripcion_proveedor: null,
  costo: null,
  ubicacion: null,
  color: "#3B82F6",
  estatus: "Activo",
};

const INSTALADOR = {
  id_instalador: 20,
  nombre_instalador: "Instalador Test",
  apodo: null,
  tipo: "Instalador",
  telefono: "5558765432",
  correo: "instalador@test.com",
  costo_instalacion: 500,
  notas: null,
  ubicacion: null,
  color: "#10B981",
  estatus: "Activo",
};

// Minimal detalle shape — only fields accessed by the route's item builders.
const DETALLE = {
  id_detalle: 1,
  id_pedido: 1,
  id_servicio: 1,
  id_material: 1,
  id_archivo: 1,
  cantidad: 2,
  responsable_recoleccion: "Test User",
  notas: null,
  precio_unitario: 100,
  subtotal: 200,
  servicio: { id_servicio: 1, nombre_servicio: "Corte Láser" },
  material: { id_material: 1, nombre_material: "Acero Inoxidable" },
};

const PROVEEDOR_PRECIO = {
  id_proveedor_precio: 100,
  id_proveedor: 10,
  id_servicio: 1,
  id_material: null,
  precio: 150,
  notas: null,
  proveedor: PROVEEDOR,
};

const INSTALADOR_SERVICIO = {
  id_instalador_servicio: 200,
  id_instalador: 20,
  id_servicio: 1,
  costo: 300,
  notas: null,
  instalador: INSTALADOR,
};

// ProveedorEntry shape consumed by the route.
const PROVEEDOR_ENTRY = {
  proveedor: PROVEEDOR,
  detalles: [DETALLE],
  precios: [PROVEEDOR_PRECIO],
};

// InstaladorEntry shape consumed by the route.
const INSTALADOR_ENTRY = {
  instalador: INSTALADOR,
  detalles: [DETALLE],
  costos: [INSTALADOR_SERVICIO],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// URL layout: /api/pedidos/[id]/orden-compra-interna → parts[3] = id
const paramExtractor = (url: URL) => {
  const parts = url.pathname.split("/");
  return { id: parts[3] };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/pedidos/[id]/orden-compra-interna", () => {
  let purchaseOrderPOST: NextRouteHandler;

  beforeAll(async () => {
    // Dynamic import so that jest.mock() calls above are hoisted before module load.
    const mod = await import("@/app/api/pedidos/[id]/orden-compra-interna/route");
    purchaseOrderPOST = mod.POST as unknown as NextRouteHandler;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: authenticated as Direccion.
    mockGetSession.mockResolvedValue({ id: 1, email: "admin@geek.com", role: "Direccion" });
    // Default PDF stub — a real Buffer so .toString("base64") works.
    mockGeneratePDF.mockResolvedValue(Buffer.from("PDF_STUB"));
    mockCalcularTotales.mockReturnValue({ subtotal_general: 100, iva: 16, total: 116 });
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  describe("authentication and authorization", () => {
    it("returns 401 when no session is present", async () => {
      mockGetSession.mockResolvedValue(null);

      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.status).toBe(401);
    });

    it("returns 403 when role is not Direccion or Colaborador", async () => {
      mockGetSession.mockResolvedValue({ id: 1, email: "fin@geek.com", role: "Finanzas" });

      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.status).toBe(403);
    });

    it("accepts Colaborador role", async () => {
      mockGetSession.mockResolvedValue({ id: 2, email: "colab@geek.com", role: "Colaborador" });
      mockGetOrderThirdParties.mockResolvedValue({
        pedido: PEDIDO,
        sucursal: SUCURSAL,
        proveedorMap: new Map([[10, PROVEEDOR_ENTRY]]),
        instaladorMap: new Map(),
      });

      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      // Any non-4xx proves the guard admitted the request.
      expect(res.status).toBe(200);
    });
  });

  // ── 1. Single proveedor ───────────────────────────────────────────────────

  describe("1. single proveedor linked via ProveedorPrecios", () => {
    beforeEach(() => {
      mockGetOrderThirdParties.mockResolvedValue({
        pedido: PEDIDO,
        sucursal: SUCURSAL,
        proveedorMap: new Map([[10, PROVEEDOR_ENTRY]]),
        instaladorMap: new Map(),
      });
    });

    it("returns HTTP 200", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.status).toBe(200);
    });

    it("responds with Content-Type: application/pdf", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.headers["content-type"]).toMatch(/application\/pdf/);
    });

    it("sets Content-Disposition attachment header", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.headers["content-disposition"]).toMatch(/attachment/);
    });

    it("calls generatePurchaseOrderPDF once with proveedor data as vendedor", async () => {
      await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(mockGeneratePDF).toHaveBeenCalledTimes(1);
      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          vendedor: expect.objectContaining({ nombre: "Proveedor Test" }),
        })
      );
    });
  });

  // ── 2. Single instalador ──────────────────────────────────────────────────

  describe("2. single instalador linked via InstaladorServicios", () => {
    beforeEach(() => {
      mockGetOrderThirdParties.mockResolvedValue({
        pedido: PEDIDO,
        sucursal: SUCURSAL,
        proveedorMap: new Map(),
        instaladorMap: new Map([[20, INSTALADOR_ENTRY]]),
      });
    });

    it("returns HTTP 200", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.status).toBe(200);
    });

    it("responds with Content-Type: application/pdf", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.headers["content-type"]).toMatch(/application\/pdf/);
    });

    it("calls generatePurchaseOrderPDF once with instalador data as vendedor", async () => {
      await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(mockGeneratePDF).toHaveBeenCalledTimes(1);
      expect(mockGeneratePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          vendedor: expect.objectContaining({ nombre: "Instalador Test" }),
        })
      );
    });
  });

  // ── 3. Multiple terceros (proveedor + instalador) ─────────────────────────

  describe("3. multiple terceros — proveedor + instalador", () => {
    beforeEach(() => {
      mockGetOrderThirdParties.mockResolvedValue({
        pedido: PEDIDO,
        sucursal: SUCURSAL,
        proveedorMap: new Map([[10, PROVEEDOR_ENTRY]]),
        instaladorMap: new Map([[20, INSTALADOR_ENTRY]]),
      });
    });

    it("returns HTTP 200 JSON", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/json/);
    });

    it("ordenes_generadas contains two entries", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.body.ordenes_generadas).toHaveLength(2);
    });

    it("first entry is tipo: proveedor with correct nombre", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      const first = res.body.ordenes_generadas[0];
      expect(first.tipo).toBe("proveedor");
      expect(first.nombre).toBe("Proveedor Test");
    });

    it("second entry is tipo: instalador with correct nombre", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      const second = res.body.ordenes_generadas[1];
      expect(second.tipo).toBe("instalador");
      expect(second.nombre).toBe("Instalador Test");
    });

    it("each entry contains a non-empty pdf_base64 string", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      for (const orden of res.body.ordenes_generadas) {
        expect(typeof orden.pdf_base64).toBe("string");
        expect(orden.pdf_base64.length).toBeGreaterThan(0);
      }
    });

    it("each entry contains a numeric total from calcularTotalesOrden", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      for (const orden of res.body.ordenes_generadas) {
        expect(typeof orden.total).toBe("number");
        expect(orden.total).toBe(116); // matches mockCalcularTotales stub
      }
    });

    it("calls generatePurchaseOrderPDF twice — once per tercero", async () => {
      await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(mockGeneratePDF).toHaveBeenCalledTimes(2);
    });
  });

  // ── 4. No linked terceros ─────────────────────────────────────────────────

  describe("4. pedido with no priced terceros linked", () => {
    beforeEach(() => {
      mockGetOrderThirdParties.mockResolvedValue({
        pedido: PEDIDO,
        sucursal: SUCURSAL,
        proveedorMap: new Map(),
        instaladorMap: new Map(),
      });
    });

    it("returns 400", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.status).toBe(400);
    });

    it("error message mentions terceros", async () => {
      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(res.body.error).toMatch(/terceros/i);
    });

    it("never calls generatePurchaseOrderPDF", async () => {
      await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/1/orden-compra-interna")
        .send();

      expect(mockGeneratePDF).not.toHaveBeenCalled();
    });
  });

  // ── 5. Non-existent pedido ────────────────────────────────────────────────

  describe("5. non-existent pedido", () => {
    it("returns 404 when getOrderThirdParties throws NotFoundError", async () => {
      mockGetOrderThirdParties.mockRejectedValue(new NotFoundError("Pedido 999 no encontrado"));

      const res = await createApp({ POST: purchaseOrderPOST }, paramExtractor)
        .post("/api/pedidos/999/orden-compra-interna")
        .send();

      expect(res.status).toBe(404);
    });
  });
});

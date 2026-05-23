/**
 * @jest-environment node
 *
 * Unit tests for getOrderThirdParties in lib/services/pedidos.ts.
 *
 * The function runs two parallel Prisma queries and groups DetallePedido rows
 * by third party into { proveedorMap, instaladorMap }.
 *
 * Only PRICED paths are valid — Servicios.id_proveedor and
 * Servicios.id_instalador (direct FKs) are intentionally excluded because
 * they carry no price row and a purchase order cannot be raised without one.
 *
 * Valid paths:
 *   Proveedor B – ProveedorPrecios where id_servicio matches the detalle
 *   Proveedor C – ProveedorPrecios where id_material matches the detalle
 *   Instalador B – InstaladorServicios where id_servicio matches the detalle
 */
import { prisma } from "@/lib/db/client";
import { getOrderThirdParties } from "@/lib/services/pedidos";
import { NotFoundError } from "@/lib/utils/errors";

// ─── Mock ─────────────────────────────────────────────────────────────────────

jest.mock("@/lib/db/client", () => ({
  prisma: {
    pedidos: {
      findUnique: jest.fn(),
    },
    detallePedido: {
      findMany: jest.fn(),
    },
  },
}));

const mockFindUniquePedido = prisma.pedidos.findUnique as jest.Mock;
const mockFindManyDetalles = prisma.detallePedido.findMany as jest.Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CLIENTE = {
  id_cliente: 1,
  nombre_cliente: "Cliente Test",
  empresa: "Empresa Test",
  rfc: null,
  correo_electronico: "test@test.com",
  numero_telefono: "5551234567",
  categoria: null,
};

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
  cliente: CLIENTE,
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
  estatus: "Activo",
};

/** ProveedorPrecios linked to a service — proveedor path B. */
const PROVEEDOR_PRECIO_SERVICIO = {
  id_proveedor_precio: 100,
  id_proveedor: 10,
  id_servicio: 1,
  id_material: null,
  precio: 150,
  notas: null,
  proveedor: PROVEEDOR,
};

/** ProveedorPrecios linked to a material — proveedor path C. */
const PROVEEDOR_PRECIO_MATERIAL = {
  id_proveedor_precio: 101,
  id_proveedor: 10,
  id_servicio: null,
  id_material: 1,
  precio: 80,
  notas: null,
  proveedor: PROVEEDOR,
};

/** InstaladorServicios row — instalador path B. */
const INSTALADOR_SERVICIO = {
  id_instalador_servicio: 200,
  id_instalador: 20,
  id_servicio: 1,
  costo: 300,
  notas: null,
  instalador: INSTALADOR,
};

/**
 * Servicio with no priced third-party rows.
 * Note: id_proveedor / id_instalador FK fields are deliberately absent —
 * they are not fetched by the include config and must not trigger any grouping.
 */
const SERVICIO_BASE = {
  id_servicio: 1,
  id_estatus: 1,
  id_sucursal: 1,
  nombre_servicio: "Corte Láser",
  descripcion_servicio: null,
  estatus_servicio: true,
  imagen_url: null,
  costo_instalador_override: null,
  costo_proveedor_override: null,
  fecha_modificacion: new Date("2026-01-01"),
  proveedorPrecios: [],
  instaladorServicios: [],
};

/** Material with no proveedorPrecios. */
const MATERIAL_BASE = {
  id_material: 1,
  nombre_material: "Acero Inoxidable",
  descripcion_material: null,
  unidad_medida: "m2",
  ancho: null,
  alto: null,
  grosor: null,
  color: null,
  imagen_url: null,
  proveedorPrecios: [],
};

/** Factory — builds a DetallePedido fixture with optional servicio/material overrides. */
function makeDetalle(id: number = 1, overrides: { servicio?: object; material?: object } = {}) {
  return {
    id_detalle: id,
    id_pedido: 1,
    id_servicio: 1,
    id_material: 1,
    id_archivo: 1,
    cantidad: 2,
    responsable_recoleccion: "Test User",
    notas: null,
    precio_unitario: 100,
    subtotal: 200,
    servicio: overrides.servicio ?? SERVICIO_BASE,
    material: overrides.material ?? MATERIAL_BASE,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("getOrderThirdParties", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default happy-path setup; individual tests override only what they need.
    mockFindUniquePedido.mockResolvedValue(PEDIDO);
    mockFindManyDetalles.mockResolvedValue([]);
  });

  // ── 1. Proveedor via ProveedorPrecios (path B — service-level price) ────────
  describe("proveedor linked via ProveedorPrecios where id_servicio matches (path B)", () => {
    it("adds one entry to proveedorMap keyed by id_proveedor", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: { ...SERVICIO_BASE, proveedorPrecios: [PROVEEDOR_PRECIO_SERVICIO] },
        }),
      ]);

      const { proveedorMap } = await getOrderThirdParties(1);

      expect(proveedorMap.size).toBe(1);
      expect(proveedorMap.has(10)).toBe(true);
    });

    it("entry contains the detalle and the ProveedorPrecios row", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: { ...SERVICIO_BASE, proveedorPrecios: [PROVEEDOR_PRECIO_SERVICIO] },
        }),
      ]);

      const { proveedorMap } = await getOrderThirdParties(1);

      const entry = proveedorMap.get(10)!;
      expect(entry.proveedor.id_proveedor).toBe(10);
      expect(entry.detalles).toHaveLength(1);
      expect(entry.precios).toHaveLength(1);
      expect(entry.precios[0].id_proveedor_precio).toBe(100);
    });

    it("instaladorMap stays empty", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: { ...SERVICIO_BASE, proveedorPrecios: [PROVEEDOR_PRECIO_SERVICIO] },
        }),
      ]);

      const { instaladorMap } = await getOrderThirdParties(1);

      expect(instaladorMap.size).toBe(0);
    });
  });

  // ── 2. Instalador via InstaladorServicios (path B) ─────────────────────────
  describe("instalador linked via InstaladorServicios where id_servicio matches (path B)", () => {
    it("adds one entry to instaladorMap keyed by id_instalador", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: { ...SERVICIO_BASE, instaladorServicios: [INSTALADOR_SERVICIO] },
        }),
      ]);

      const { instaladorMap } = await getOrderThirdParties(1);

      expect(instaladorMap.size).toBe(1);
      expect(instaladorMap.has(20)).toBe(true);
    });

    it("entry contains the detalle and the InstaladorServicios row", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: { ...SERVICIO_BASE, instaladorServicios: [INSTALADOR_SERVICIO] },
        }),
      ]);

      const { instaladorMap } = await getOrderThirdParties(1);

      const entry = instaladorMap.get(20)!;
      expect(entry.instalador.id_instalador).toBe(20);
      expect(entry.detalles).toHaveLength(1);
      expect(entry.costos).toHaveLength(1);
      expect(entry.costos[0].id_instalador_servicio).toBe(200);
    });

    it("proveedorMap stays empty", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: { ...SERVICIO_BASE, instaladorServicios: [INSTALADOR_SERVICIO] },
        }),
      ]);

      const { proveedorMap } = await getOrderThirdParties(1);

      expect(proveedorMap.size).toBe(0);
    });
  });

  // ── 3. Both proveedor (path B) and instalador (path B) on the same detalle ─
  describe("detalle linked to both a proveedor (path B) and an instalador (path B)", () => {
    it("populates both maps", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: {
            ...SERVICIO_BASE,
            proveedorPrecios: [PROVEEDOR_PRECIO_SERVICIO],
            instaladorServicios: [INSTALADOR_SERVICIO],
          },
        }),
      ]);

      const { proveedorMap, instaladorMap } = await getOrderThirdParties(1);

      expect(proveedorMap.size).toBe(1);
      expect(instaladorMap.size).toBe(1);
    });

    it("each map entry contains the same detalle exactly once", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: {
            ...SERVICIO_BASE,
            proveedorPrecios: [PROVEEDOR_PRECIO_SERVICIO],
            instaladorServicios: [INSTALADOR_SERVICIO],
          },
        }),
      ]);

      const { proveedorMap, instaladorMap } = await getOrderThirdParties(1);

      expect(proveedorMap.get(10)!.detalles).toHaveLength(1);
      expect(instaladorMap.get(20)!.detalles).toHaveLength(1);
    });
  });

  // ── 4. No terceros linked ──────────────────────────────────────────────────
  describe("pedido with no terceros linked", () => {
    it("returns both maps empty when service and material have no priced rows", async () => {
      mockFindManyDetalles.mockResolvedValue([makeDetalle()]);

      const { proveedorMap, instaladorMap } = await getOrderThirdParties(1);

      expect(proveedorMap.size).toBe(0);
      expect(instaladorMap.size).toBe(0);
    });

    it("returns both maps empty when there are no detalles at all", async () => {
      mockFindManyDetalles.mockResolvedValue([]);

      const { proveedorMap, instaladorMap } = await getOrderThirdParties(1);

      expect(proveedorMap.size).toBe(0);
      expect(instaladorMap.size).toBe(0);
    });
  });

  // ── 5. Pedido not found ────────────────────────────────────────────────────
  describe("pedido not found", () => {
    it("throws NotFoundError when pedido is null", async () => {
      mockFindUniquePedido.mockResolvedValue(null);

      await expect(getOrderThirdParties(999)).rejects.toThrow(NotFoundError);
    });

    it("error message includes the requested id", async () => {
      mockFindUniquePedido.mockResolvedValue(null);

      await expect(getOrderThirdParties(42)).rejects.toThrow("42");
    });
  });

  // ── 6. Same proveedor via path B (service) AND path C (material) — no dup ──
  describe("detalle linked to same proveedor via path B (service price) and path C (material price)", () => {
    it("detalle appears exactly once in the proveedor entry", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: {
            ...SERVICIO_BASE,
            proveedorPrecios: [PROVEEDOR_PRECIO_SERVICIO], // path B
          },
          material: {
            ...MATERIAL_BASE,
            proveedorPrecios: [PROVEEDOR_PRECIO_MATERIAL], // path C — same proveedor
          },
        }),
      ]);

      const { proveedorMap } = await getOrderThirdParties(1);

      expect(proveedorMap.size).toBe(1);
      // Both paths resolve to the same proveedor — detalle must not be duplicated.
      expect(proveedorMap.get(10)!.detalles).toHaveLength(1);
    });

    it("both ProveedorPrecios rows are recorded in precios", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: {
            ...SERVICIO_BASE,
            proveedorPrecios: [PROVEEDOR_PRECIO_SERVICIO],
          },
          material: {
            ...MATERIAL_BASE,
            proveedorPrecios: [PROVEEDOR_PRECIO_MATERIAL],
          },
        }),
      ]);

      const { proveedorMap } = await getOrderThirdParties(1);

      const precios = proveedorMap.get(10)!.precios;
      expect(precios).toHaveLength(2);
      expect(precios.map((p) => p.id_proveedor_precio).sort()).toEqual([100, 101]);
    });
  });

  // ── Regression: direct FK paths are ignored ────────────────────────────────
  describe("direct FK paths (Servicios.id_proveedor / id_instalador) are not valid", () => {
    it("proveedorMap stays empty when only the FK is set (no ProveedorPrecios row)", async () => {
      // Simulate a service that has id_proveedor set in the DB but no ProveedorPrecios row —
      // the include config no longer fetches id_proveedor, so the field is absent from the
      // payload and cannot trigger grouping.
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          // SERVICIO_BASE has proveedorPrecios: [] and instaladorServicios: [] — no prices.
          servicio: SERVICIO_BASE,
        }),
      ]);

      const { proveedorMap } = await getOrderThirdParties(1);

      expect(proveedorMap.size).toBe(0);
    });

    it("instaladorMap stays empty when only the FK is set (no InstaladorServicios row)", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: SERVICIO_BASE, // instaladorServicios: []
        }),
      ]);

      const { instaladorMap } = await getOrderThirdParties(1);

      expect(instaladorMap.size).toBe(0);
    });
  });

  // ── Bonus A: proveedor via material.proveedorPrecios (path C only) ─────────
  describe("proveedor linked solely via material.proveedorPrecios (path C)", () => {
    it("populates proveedorMap from the material price row", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          material: { ...MATERIAL_BASE, proveedorPrecios: [PROVEEDOR_PRECIO_MATERIAL] },
        }),
      ]);

      const { proveedorMap } = await getOrderThirdParties(1);

      expect(proveedorMap.size).toBe(1);
      const entry = proveedorMap.get(10)!;
      expect(entry.detalles).toHaveLength(1);
      expect(entry.precios).toHaveLength(1);
      expect(entry.precios[0].id_proveedor_precio).toBe(101);
    });
  });

  // ── Bonus B: same ProveedorPrecios row across two detalles — no dup precios ─
  describe("two detalles sharing the same service (same ProveedorPrecios rows)", () => {
    it("ProveedorPrecios row appears once in precios even though two detalles reference it", async () => {
      mockFindManyDetalles.mockResolvedValue([
        makeDetalle(1, {
          servicio: { ...SERVICIO_BASE, proveedorPrecios: [PROVEEDOR_PRECIO_SERVICIO] },
        }),
        makeDetalle(2, {
          servicio: { ...SERVICIO_BASE, proveedorPrecios: [PROVEEDOR_PRECIO_SERVICIO] },
        }),
      ]);

      const { proveedorMap } = await getOrderThirdParties(1);

      expect(proveedorMap.size).toBe(1);
      const entry = proveedorMap.get(10)!;
      // Both detalles belong to this proveedor.
      expect(entry.detalles).toHaveLength(2);
      // But the ProveedorPrecios row (id 100) must not be duplicated.
      expect(entry.precios).toHaveLength(1);
    });
  });

  // ── Bonus C: return shape ──────────────────────────────────────────────────
  describe("return shape", () => {
    it("returns the pedido object from Prisma unchanged", async () => {
      const { pedido } = await getOrderThirdParties(1);

      expect(pedido).toBe(PEDIDO);
    });

    it("sucursal is the same reference as pedido.sucursal", async () => {
      const { pedido, sucursal } = await getOrderThirdParties(1);

      expect(sucursal).toBe(pedido.sucursal);
    });

    it("passes the correct id_pedido to both Prisma calls", async () => {
      await getOrderThirdParties(7);

      expect(mockFindUniquePedido).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_pedido: 7 } })
      );
      expect(mockFindManyDetalles).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_pedido: 7 } })
      );
    });
  });
});

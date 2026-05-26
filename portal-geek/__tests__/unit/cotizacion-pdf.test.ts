/**
 * @jest-environment node
 *
 * ST-19 — Prisma payload → WorkOrderTemplate context mapping.
 *
 * The route's integration test mocks React-PDF, so the mapping is not exercised
 * there. This suite covers it directly so a future schema/include change
 * surfaces here rather than silently producing a broken PDF.
 */
import {
  buildWorkOrderContext,
  DEFAULT_BRANCH,
  type QuoteForPdf,
} from "@/lib/services/cotizacion-pdf";

// Minimal Prisma-shaped fixture. Decimal columns are stringified by Prisma
// when returned over the wire; we model that here.
const decimal = (n: number) => ({ toString: () => String(n) });

const baseQuote = (): QuoteForPdf => ({
  id_cotizacion: 42,
  folio: "GD-2026-00042",
  monto_total: decimal(1180.0),
  fecha_creacion: new Date("2026-01-01"),
  fecha_validacion: new Date("2026-01-02"),
  fecha_aprobacion: new Date("2026-01-03"),
  cliente: {
    nombre_cliente: "Cliente Demo",
    empresa: "Demo Studio",
    correo_electronico: "demo@x.mx",
    numero_telefono: "4421234567",
  },
  pedido: {
    id_pedido: 100,
    sucursal: {
      nombre_sucursal: "Sucursal Principal",
      direccion: "Monterrey, NL",
    },
    detalles: [
      {
        notas: "Stickers para evento",
        cantidad: 2,
        precio_unitario: decimal(590.0),
        subtotal: decimal(1180.0),
        servicio: { nombre_servicio: "Corte Láser" },
        material: { nombre_material: "Acrílico 3mm" },
        archivo: { url_archivo: "disenios/2026/05/abc.svg" },
      },
    ],
  },
});

describe("buildWorkOrderContext (ST-19 mapping)", () => {
  it("mapea los campos top-level de la cotización al bloque quotation", () => {
    const ctx = buildWorkOrderContext(baseQuote());
    expect(ctx.quotation).toEqual({
      id_cotizacion: 42,
      folio: "GD-2026-00042",
      monto_total: 1180,
      fecha_creacion: new Date("2026-01-01"),
      fecha_validacion: new Date("2026-01-02"),
      fecha_aprobacion: new Date("2026-01-03"),
    });
  });

  it("convierte Decimal stringificado de Prisma a number en monto_total / subtotal / precio_unitario", () => {
    const ctx = buildWorkOrderContext(baseQuote());
    expect(typeof ctx.quotation.monto_total).toBe("number");
    expect(typeof ctx.specs[0].precio_unitario).toBe("number");
    expect(typeof ctx.specs[0].subtotal).toBe("number");
    expect(ctx.specs[0].precio_unitario).toBe(590);
    expect(ctx.specs[0].subtotal).toBe(1180);
  });

  it("mapea cliente con todos los campos requeridos por el template", () => {
    const ctx = buildWorkOrderContext(baseQuote());
    expect(ctx.client).toEqual({
      nombre_cliente: "Cliente Demo",
      empresa: "Demo Studio",
      correo_electronico: "demo@x.mx",
      numero_telefono: "4421234567",
    });
  });

  it("preserva cliente.empresa = null", () => {
    const q = baseQuote();
    q.cliente.empresa = null as unknown as string;
    const ctx = buildWorkOrderContext(q);
    expect(ctx.client.empresa).toBeNull();
  });

  it("mapea cada detalle a su spec con servicio + material + archivo + cantidades", () => {
    const ctx = buildWorkOrderContext(baseQuote());
    expect(ctx.specs).toHaveLength(1);
    expect(ctx.specs[0]).toEqual({
      servicio: { nombre_servicio: "Corte Láser" },
      material: { nombre_material: "Acrílico 3mm" },
      archivo: { url_archivo: "disenios/2026/05/abc.svg" },
      notas: "Stickers para evento",
      cantidad: 2,
      precio_unitario: 590,
      subtotal: 1180,
    });
  });

  it("tolera detalle con archivo = null (cliente sin diseño)", () => {
    const q = baseQuote();
    q.pedido!.detalles[0].archivo = null;
    const ctx = buildWorkOrderContext(q);
    expect(ctx.specs[0].archivo).toBeNull();
  });

  it("tolera detalle con notas = null", () => {
    const q = baseQuote();
    q.pedido!.detalles[0].notas = null;
    const ctx = buildWorkOrderContext(q);
    expect(ctx.specs[0].notas).toBeNull();
  });

  it("mapea múltiples detalles preservando orden", () => {
    const q = baseQuote();
    q.pedido!.detalles.push({
      notas: "Segundo item",
      cantidad: 5,
      precio_unitario: decimal(100),
      subtotal: decimal(500),
      servicio: { nombre_servicio: "Grabado Láser" },
      material: { nombre_material: "MDF 3mm" },
      archivo: null,
    });
    const ctx = buildWorkOrderContext(q);
    expect(ctx.specs).toHaveLength(2);
    expect(ctx.specs[0].servicio?.nombre_servicio).toBe("Corte Láser");
    expect(ctx.specs[1].servicio?.nombre_servicio).toBe("Grabado Láser");
    expect(ctx.specs[1].subtotal).toBe(500);
  });

  it("mapea sucursal a branch cuando pedido.sucursal existe", () => {
    const ctx = buildWorkOrderContext(baseQuote());
    expect(ctx.branch).toEqual({
      nombre_sucursal: "Sucursal Principal",
      direccion: "Monterrey, NL",
    });
  });

  it("cae al branch por defecto cuando pedido.sucursal es null", () => {
    const q = baseQuote();
    q.pedido!.sucursal = null;
    const ctx = buildWorkOrderContext(q);
    expect(ctx.branch).toEqual(DEFAULT_BRANCH);
  });

  it("cae al branch por defecto cuando pedido es null", () => {
    const q = baseQuote();
    q.pedido = null;
    const ctx = buildWorkOrderContext(q);
    expect(ctx.branch).toEqual(DEFAULT_BRANCH);
    expect(ctx.specs).toEqual([]);
  });

  it("devuelve specs = [] cuando detalles está vacío", () => {
    const q = baseQuote();
    q.pedido!.detalles = [];
    const ctx = buildWorkOrderContext(q);
    expect(ctx.specs).toEqual([]);
  });

  it("preserva folio = null en la mapping (defensa para datos viejos)", () => {
    const q = baseQuote();
    q.folio = null;
    const ctx = buildWorkOrderContext(q);
    expect(ctx.quotation.folio).toBeNull();
  });
});

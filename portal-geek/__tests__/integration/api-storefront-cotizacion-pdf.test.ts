/**
 * @jest-environment node
 *
 * ST-19 — GET /api/storefront/cotizaciones/[folio]/pdf
 *
 * Storefront-side PDF download. Cookie auth via the magic-link session;
 * the WorkOrderTemplate render is mocked at the @react-pdf/renderer seam.
 */
import type * as PdfRouteModuleType from "@/app/api/storefront/cotizaciones/[folio]/pdf/route";
import { prisma } from "@/lib/db/client";
import { readSessionCotizacionId } from "@/lib/services/cotizacion-access";

import { createApp } from "../helpers/next-supertest";

// jose is ESM and not transpiled by next/jest. Stubbed so the route module loads.
jest.mock("jose", () => ({
  SignJWT: class {
    setProtectedHeader() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    async sign() {
      return "stub-jwt";
    }
  },
  jwtVerify: jest.fn(async () => ({ payload: {} })),
}));

jest.mock("@/lib/db/client", () => ({
  prisma: {
    cotizaciones: { findUnique: jest.fn() },
  },
}));

jest.mock("@/lib/services/cotizacion-access", () => ({
  SESSION_COOKIE_NAME: "cotizacion_session",
  readSessionCotizacionId: jest.fn(),
}));

// react-pdf is heavy + ESM-y; skip the real render by returning a known buffer.
jest.mock("@react-pdf/renderer", () => ({
  renderToBuffer: jest.fn(async () => Buffer.from("%PDF-1.4 fake-bytes")),
}));

// HeaderSection reads a PNG from disk at module init — sidestep that by
// short-circuiting the whole template into a no-op React component.
jest.mock("@/components/pdf/templates/WorkOrderTemplate", () => ({
  WorkOrderTemplate: () => null,
}));

const mockFindCotizacion = prisma.cotizaciones.findUnique as jest.Mock;
const mockReadSession = readSessionCotizacionId as jest.Mock;

const aprobadaQuote = {
  id_cotizacion: 42,
  folio: "GD-2026-00042",
  estatus: { descripcion: "Aprobada" },
  monto_total: 1180,
  fecha_creacion: new Date(),
  fecha_validacion: null,
  fecha_aprobacion: new Date(),
  cliente: {
    nombre_cliente: "Cliente Demo",
    empresa: "Demo Studio",
    correo_electronico: "demo@x.mx",
    numero_telefono: "4421234567",
  },
  pedido: {
    sucursal: { nombre_sucursal: "Sucursal Principal", direccion: "Monterrey, NL" },
    detalles: [
      {
        servicio: { nombre_servicio: "Corte Láser" },
        material: { nombre_material: "Acrílico 3mm" },
        archivo: null,
        notas: null,
        cantidad: 2,
        precio_unitario: 590,
        subtotal: 1180,
      },
    ],
  },
};

describe("GET /api/storefront/cotizaciones/[folio]/pdf (ST-19)", () => {
  let routes: typeof PdfRouteModuleType;

  beforeAll(async () => {
    routes = await import("@/app/api/storefront/cotizaciones/[folio]/pdf/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Path extractor for the [folio] dynamic segment.
  const paramExtractor = (url: URL) => ({
    folio: url.pathname.split("/").reverse()[1], // .../[folio]/pdf
  });

  it("ST19-I1: cookie válida + Aprobada → 200 application/pdf con Content-Disposition", async () => {
    mockReadSession.mockResolvedValue(42);
    mockFindCotizacion.mockResolvedValue(aprobadaQuote);

    const res = await createApp({ GET: routes.GET }, paramExtractor)
      .get("/api/storefront/cotizaciones/GD-2026-00042/pdf")
      .set("Cookie", "cotizacion_session=valid-jwt");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toBe('attachment; filename="GD-2026-00042.pdf"');
    expect(res.body.slice(0, 5).toString()).toBe("%PDF-");
  });

  it("ST19-I2: sin cookie → 307 al fallback de acceso requerido", async () => {
    mockReadSession.mockResolvedValue(null);
    // findUnique should not be reached; assert below.

    const res = await createApp({ GET: routes.GET }, paramExtractor).get(
      "/api/storefront/cotizaciones/GD-2026-00042/pdf"
    );

    expect(res.status).toBe(307);
    expect(res.headers.location).toContain("/tienda/cotizacion");
    expect(res.headers.location).toContain("estado=acceso-requerido");
    expect(mockFindCotizacion).not.toHaveBeenCalled();
  });

  it("cookie inválida/expirada (readSession devuelve null) → 307 mismo fallback (no enumeración)", async () => {
    mockReadSession.mockResolvedValue(null);

    const res = await createApp({ GET: routes.GET }, paramExtractor)
      .get("/api/storefront/cotizaciones/GD-2026-00042/pdf")
      .set("Cookie", "cotizacion_session=bad-jwt");

    expect(res.status).toBe(307);
    expect(res.headers.location).toContain("estado=acceso-requerido");
  });

  it("ST19-I2b: cookie para otra cotización (session mismatch) → 307 al fallback", async () => {
    mockReadSession.mockResolvedValue(99); // session for cotización 99
    mockFindCotizacion.mockResolvedValue(aprobadaQuote); // but loaded one is id 42

    const res = await createApp({ GET: routes.GET }, paramExtractor)
      .get("/api/storefront/cotizaciones/GD-2026-00042/pdf")
      .set("Cookie", "cotizacion_session=valid-jwt-for-other");

    expect(res.status).toBe(307);
    expect(res.headers.location).toContain("estado=acceso-requerido");
  });

  it("ST19-I4: folio inexistente → 307 al fallback (mismo path que sin cookie)", async () => {
    mockReadSession.mockResolvedValue(42);
    mockFindCotizacion.mockResolvedValue(null);

    const res = await createApp({ GET: routes.GET }, paramExtractor)
      .get("/api/storefront/cotizaciones/GD-9999-99999/pdf")
      .set("Cookie", "cotizacion_session=valid-jwt");

    expect(res.status).toBe(307);
    expect(res.headers.location).toContain("estado=acceso-requerido");
  });

  it.each(["Pendiente", "Validada", "Rechazada", "Cancelada"])(
    "ST19-I3: estatus %s → 409 con mensaje explicando que requiere Aprobada",
    async (estatus) => {
      mockReadSession.mockResolvedValue(42);
      mockFindCotizacion.mockResolvedValue({
        ...aprobadaQuote,
        estatus: { descripcion: estatus },
      });

      const res = await createApp({ GET: routes.GET }, paramExtractor)
        .get("/api/storefront/cotizaciones/GD-2026-00042/pdf")
        .set("Cookie", "cotizacion_session=valid-jwt");

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Aprobada/);
    }
  );

  it("nombre del archivo descargado coincide con el folio (no UUID)", async () => {
    mockReadSession.mockResolvedValue(42);
    mockFindCotizacion.mockResolvedValue({
      ...aprobadaQuote,
      folio: "GD-2026-12345",
    });

    const res = await createApp({ GET: routes.GET }, paramExtractor)
      .get("/api/storefront/cotizaciones/GD-2026-12345/pdf")
      .set("Cookie", "cotizacion_session=valid-jwt");

    expect(res.headers["content-disposition"]).toBe('attachment; filename="GD-2026-12345.pdf"');
  });
});

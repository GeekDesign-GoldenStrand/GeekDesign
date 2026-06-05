/**
 * @jest-environment node
 */

import CotizacionDetallePage from "@/app/(storefront)/tienda/cotizacion/[id]/page";
import { readSessionCotizacionId } from "@/lib/services/cotizacion-access";
import { getCotizacionByFolio } from "@/lib/services/cotizaciones";

jest.mock("@/lib/services/cotizaciones", () => ({
  getCotizacion: jest.fn(),
  getCotizacionByFolio: jest.fn(),
}));

// KIKW12 review #1b: page now reads a magic-link session cookie and decodes
// it via readSessionCotizacionId. Mock the whole module so jest doesn't try
// to evaluate jose (ESM-only, breaks the jest CJS transformer).
jest.mock("@/lib/services/cotizacion-access", () => ({
  SESSION_COOKIE_NAME: "cotizacion_session",
  readSessionCotizacionId: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockImplementation((name) => {
      if (name === "cotizacion_session") return { value: "stub-jwt" };
      return undefined;
    }),
  })),
}));

describe("CotizacionDetallePage Server Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the QuotationDetailView when quotation is Aprobada", async () => {
    // Previously this page short-circuited to a "Vista en construcción"
    // placeholder for Aprobada; that block was removed because
    // QuotationDetailView already handles the Aprobada state (renders the
    // banner + pedido production status block).
    const mockQuote = {
      id_cotizacion: 6,
      folio: "OT-SIM-498",
      monto_total: 12775,
      fecha_creacion: new Date(),
      notas: "Test notes",
      estatus: { descripcion: "Aprobada" },
      cliente: {
        nombre_cliente: "Juan Pérez",
        correo_electronico: "cliente@example.mx",
        empresa: "Test Corp",
      },
      pedido: {
        id_pedido: 42,
        estatus: { descripcion: "Pendiente" },
        estado_factura: { descripcion: "Cotizacion" },
        detalles: [],
      },
      variablesCotizacion: [],
    };

    (getCotizacionByFolio as jest.Mock).mockResolvedValue(mockQuote);
    (readSessionCotizacionId as jest.Mock).mockResolvedValue(6);

    const props = {
      params: Promise.resolve({ id: "6" }),
    };

    const element = await CotizacionDetallePage(props);

    expect(element).toBeDefined();

    const safeStringify = (obj: unknown): string => {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        return value;
      });
    };

    const stringified = safeStringify(element);
    // Aprobada now renders QuotationDetailView with the mapped quotation, not
    // the construction placeholder. The folio passes through as a prop value
    // and shows up in the serialized props.
    expect(stringified).not.toContain("Vista en construcción");
    expect(stringified).toContain("OT-SIM-498");
    expect(stringified).toContain('"estatus":"Aprobada"');
  });

  it("should render the 'Acceso requerido' gate when the session cookie does not authorize this cotización", async () => {
    const mockQuote = {
      id_cotizacion: 6,
      folio: "OT-SIM-498",
      monto_total: 12775,
      fecha_creacion: new Date(),
      notas: null,
      estatus: { descripcion: "Pendiente" },
      cliente: {
        nombre_cliente: "Juan Pérez",
        correo_electronico: "cliente@example.mx",
        empresa: null,
      },
      pedido: null,
      variablesCotizacion: [],
    };

    (getCotizacionByFolio as jest.Mock).mockResolvedValue(mockQuote);
    // Session is for a different cotización -> access must be denied.
    (readSessionCotizacionId as jest.Mock).mockResolvedValue(99);

    const props = { params: Promise.resolve({ id: "6" }) };
    const element = await CotizacionDetallePage(props);
    // Use the same circular-safe stringifier as the other test in this file.
    const safeStringify = (obj: unknown): string => {
      const seen = new WeakSet();
      return JSON.stringify(obj, (_key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[Circular]";
          seen.add(value);
        }
        return value;
      });
    };
    expect(safeStringify(element)).toContain("Acceso requerido");
  });
});

/**
 * @jest-environment node
 */

import CotizacionDetallePage from "@/app/(storefront)/tienda/cotizacion/[id]/page";
import { getCotizacionByFolio } from "@/lib/services/cotizaciones";

jest.mock("@/lib/services/cotizaciones", () => ({
  getCotizacion: jest.fn(),
  getCotizacionByFolio: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockImplementation((name) => {
      if (name === "client_email") return { value: "cliente@example.mx" };
      if (name === "client_folio") return { value: "6" };
      return undefined;
    }),
  })),
}));

describe("CotizacionDetallePage Server Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render 'Vista en construcción' placeholder when quotation is Aprobada", async () => {
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
        detalles: [],
      },
    };

    (getCotizacionByFolio as jest.Mock).mockResolvedValue(mockQuote);

    const props = {
      params: Promise.resolve({ id: "6" }),
      searchParams: Promise.resolve({ email: "cliente@example.mx" }),
    };

    const element = await CotizacionDetallePage(props);

    // Verify it returns the under construction screen by inspecting JSX children/content
    expect(element).toBeDefined();

    // Helper to safely stringify objects with circular references
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
    expect(stringified).toContain("Vista en construcción");
    expect(stringified).toContain("La vista está en construcción. Próximamente estará disponible.");
  });
});

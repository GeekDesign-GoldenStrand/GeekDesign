/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { createCotizacionFromCart } from "@/lib/services/cotizaciones";
import { calcularPrecioServicio } from "@/lib/services/formula-pricing";
import { ValidationError } from "@/lib/utils/errors";

// ── DB mock ───────────────────────────────────────────────────────────────────
jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn((cb) => cb(prisma)),
    cotizaciones: {
      create: jest.fn(),
    },
    formulas: {
      findFirst: jest.fn(),
    },
    sucursales: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
    clientes: {
      upsert: jest.fn(),
    },
    estatusPedidos: {
      findUnique: jest.fn(),
    },
    estadoFacturaPedido: {
      findUnique: jest.fn(),
    },
    estatusCotizacion: {
      findUnique: jest.fn(),
    },
    pedidos: {
      create: jest.fn(),
    },
    archivosDisenio: {
      create: jest.fn(),
    },
    detallePedido: {
      create: jest.fn(),
    },
    variablesCotizacion: {
      createMany: jest.fn(),
    },
    historialEstadosCotizacion: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/services/formula-pricing", () => ({
  calcularPrecioServicio: jest.fn(),
}));

const mockFindFormula = prisma.formulas.findFirst as jest.Mock;
const mockFindSucursal = prisma.sucursales.findUnique as jest.Mock;
const mockCalcularPrecio = calcularPrecioServicio as jest.Mock;

describe("createCotizacionFromCart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindSucursal.mockResolvedValue({ id_sucursal: 1, estatus: "Activo" });
    mockFindFormula.mockResolvedValue({
      id_servicio: 1,
      estatus: "Activa",
      variables: [],
    });
  });

  // ── Overflow guard ────────────────────────────────────────────────────────
  it("lanza ValidationError si el monto total supera MONTO_TOTAL_MAX", async () => {
    // 1000 de cantidad * 100,000 de precio = 100,000,000 (Excede 99,999,999.99)
    mockCalcularPrecio.mockResolvedValue(100000);

    const input = {
      cliente: {
        nombre_cliente: "Test User",
        correo_electronico: "test@example.com",
        numero_telefono: "1234567890",
      },
      id_sucursal: 1,
      fecha_estimada: new Date(),
      items: [
        {
          id_servicio: 1,
          id_material: 1,
          cantidad: 1000,
          variables: [],
        },
      ],
    };

    await expect(
      createCotizacionFromCart(input as Parameters<typeof createCotizacionFromCart>[0])
    ).rejects.toThrow(ValidationError);
  });
});

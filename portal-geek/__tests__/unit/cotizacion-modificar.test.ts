/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { updateCotizacion } from "@/lib/services/cotizaciones";
import { NotFoundError } from "@/lib/utils/errors";

// ── DB mock ───────────────────────────────────────────────────────────────────
jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    cotizaciones: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    detallePedido: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindUnique = prisma.cotizaciones.findUnique as jest.Mock;
const mockUpdate = prisma.cotizaciones.update as jest.Mock;
const mockDetallePedidoUpdate = prisma.detallePedido.update as jest.Mock;
const mockDetallePedidoFindMany = prisma.detallePedido.findMany as jest.Mock;

// ── Fixtures ──────────────────────────────────────────────────────────────────
const COTIZACION_PENDIENTE = {
  id_cotizacion: 1,
  id_pedido: 10,
  monto_total: "1000.00",
  porcentaje_descuento: null,
  motivo_descuento: null,
  id_estatus_cotizacion: 1,
  estatus: { descripcion: "Pendiente" },
  pedido: {
    detalles: [{ subtotal: "600.00" }, { subtotal: "400.00" }],
  },
};

const COTIZACION_VALIDADA = {
  ...COTIZACION_PENDIENTE,
  estatus: { descripcion: "Validada" },
};

const COTIZACION_APROBADA = {
  ...COTIZACION_PENDIENTE,
  estatus: { descripcion: "Aprobada" },
};

const COTIZACION_CON_DESCUENTO = {
  ...COTIZACION_PENDIENTE,
  monto_total: "900.00",
  porcentaje_descuento: "10.00",
  motivo_descuento: "Cliente frecuente",
};

describe("updateCotizacion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: transaction passes tx = prisma
    mockTransaction.mockImplementation((fn) =>
      fn({
        cotizaciones: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
        detallePedido: {
          update: mockDetallePedidoUpdate,
          findMany: mockDetallePedidoFindMany,
        },
      })
    );
  });

  // ── Not found ─────────────────────────────────────────────────────────────
  it("lanza NotFoundError cuando la cotización no existe", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(updateCotizacion(999, { nombre_oportunidad: "Test" })).rejects.toThrow(
      NotFoundError
    );
  });

  it("el mensaje de NotFoundError incluye el id", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(updateCotizacion(42, { nombre_oportunidad: "Test" })).rejects.toThrow("42");
  });

  // ── Transaction ───────────────────────────────────────────────────────────
  it("ejecuta todo dentro de una transacción", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, { nombre_oportunidad: "Test" });

    expect(mockTransaction).toHaveBeenCalled();
  });

  // ── Field updates ─────────────────────────────────────────────────────────
  it("actualiza nombre_oportunidad correctamente", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, { nombre_oportunidad: "Letrero exterior" });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nombre_oportunidad: "Letrero exterior" }),
      })
    );
  });

  it("actualiza id_cliente correctamente", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, { id_cliente: 5 });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ id_cliente: 5 }),
      })
    );
  });

  it("actualiza notas correctamente", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, { notas: "Nota de prueba" });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notas: "Nota de prueba" }),
      })
    );
  });

  it("no incluye campos no proporcionados en el update", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, { notas: "Solo notas" });

    const calledData = mockUpdate.mock.calls[0][0].data;
    expect(calledData).not.toHaveProperty("nombre_oportunidad");
    expect(calledData).not.toHaveProperty("id_cliente");
    expect(calledData).not.toHaveProperty("fecha_fin");
  });

  it("llama a update con el id correcto", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, { notas: "Test" });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_cotizacion: 1 } })
    );
  });

  // ── Servicios (DetallePedido) ──────────────────────────────────────────────
  it("actualiza cada DetallePedido cuando se envían servicios", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockDetallePedidoUpdate.mockResolvedValue({});
    mockDetallePedidoFindMany.mockResolvedValue([{ subtotal: "200.00" }, { subtotal: "300.00" }]);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, {
      servicios: [
        { id_detalle: 1, cantidad: 2, precio_unitario: 100 },
        { id_detalle: 2, cantidad: 3, precio_unitario: 100 },
      ],
    });

    expect(mockDetallePedidoUpdate).toHaveBeenCalledTimes(2);
  });

  it("recalcula subtotal de cada detalle (cantidad × precio_unitario)", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockDetallePedidoUpdate.mockResolvedValue({});
    mockDetallePedidoFindMany.mockResolvedValue([{ subtotal: "500.00" }]);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, {
      servicios: [{ id_detalle: 1, cantidad: 5, precio_unitario: 100 }],
    });

    expect(mockDetallePedidoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_detalle: 1 },
        data: expect.objectContaining({
          cantidad: 5,
          precio_unitario: 100,
          subtotal: 500,
        }),
      })
    );
  });

  it("recalcula monto_total desde los detalles actualizados", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockDetallePedidoUpdate.mockResolvedValue({});
    // Simula los detalles tras la actualización
    mockDetallePedidoFindMany.mockResolvedValue([{ subtotal: "200.00" }, { subtotal: "300.00" }]);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, {
      servicios: [
        { id_detalle: 1, cantidad: 2, precio_unitario: 100 },
        { id_detalle: 2, cantidad: 3, precio_unitario: 100 },
      ],
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ monto_total: 500 }),
      })
    );
  });

  it("no actualiza detalles cuando servicios está vacío", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, { nombre_oportunidad: "Test", servicios: [] });

    expect(mockDetallePedidoUpdate).not.toHaveBeenCalled();
  });

  it("no actualiza detalles cuando servicios no se proporciona", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await updateCotizacion(1, { nombre_oportunidad: "Test" });

    expect(mockDetallePedidoUpdate).not.toHaveBeenCalled();
  });

  it("el monto_total del caller tiene menor prioridad que el recalculado", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockDetallePedidoUpdate.mockResolvedValue({});
    mockDetallePedidoFindMany.mockResolvedValue([{ subtotal: "750.00" }]);
    mockUpdate.mockResolvedValue({});

    // El caller manda monto_total: 9999 pero los detalles suman 750
    await updateCotizacion(1, {
      monto_total: 9999,
      servicios: [{ id_detalle: 1, cantidad: 1, precio_unitario: 750 }],
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ monto_total: 750 }),
      })
    );
  });

  // ── Return value ──────────────────────────────────────────────────────────
  it("retorna el resultado del update", async () => {
    const updated = { id_cotizacion: 1, nombre_oportunidad: "Letrero" };
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue(updated);

    const result = await updateCotizacion(1, { nombre_oportunidad: "Letrero" });

    expect(result).toEqual(updated);
  });
});

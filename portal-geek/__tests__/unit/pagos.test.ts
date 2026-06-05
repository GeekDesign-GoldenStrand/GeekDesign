import { prisma } from "@/lib/db/client";
import { MAX_PAGOS_POR_PEDIDO } from "@/lib/schemas/pagos";
import type { CreatePagoInput } from "@/lib/schemas/pagos";
import { createPago } from "@/lib/services/pagos";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    pedidos: { findUnique: jest.fn() },
    pagos: { create: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
    detallePedido: { aggregate: jest.fn() },
  },
}));

const baseInput: CreatePagoInput = {
  id_pedido: 1,
  monto_pago: 1500,
  metodo_pago: "transferencia",
  estatus_pago: "Pagado",
};

// Mutable order state the aggregate mocks read from; reset in beforeEach.
let totalPedido = 10000;
let sumPagado = 0;
let sumReembolsado = 0;

describe("createPago", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    totalPedido = 10000;
    sumPagado = 0;
    sumReembolsado = 0;

    (prisma.pedidos.findUnique as jest.Mock).mockResolvedValue({ id_pedido: 1 });
    (prisma.pagos.count as jest.Mock).mockResolvedValue(0);
    (prisma.detallePedido.aggregate as jest.Mock).mockImplementation(() =>
      Promise.resolve({ _sum: { subtotal: totalPedido } })
    );
    (prisma.pagos.aggregate as jest.Mock).mockImplementation(({ where }) => {
      const monto = where.estatus_pago === "Reembolsado" ? sumReembolsado : sumPagado;
      return Promise.resolve({ _sum: { monto_pago: monto } });
    });
    (prisma.pagos.create as jest.Mock).mockResolvedValue({ id_pago: 9 });
  });

  it("creates a payment when the parent order exists and has a balance", async () => {
    await createPago(baseInput);

    expect(prisma.pagos.create).toHaveBeenCalledWith({
      data: {
        id_pedido: 1,
        monto_pago: 1500,
        metodo_pago: "transferencia",
        estatus_pago: "Pagado",
        referencia_mercadopago: null,
      },
    });
  });

  it("throws NotFoundError when the order does not exist", async () => {
    (prisma.pedidos.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(createPago(baseInput)).rejects.toBeInstanceOf(NotFoundError);
    expect(prisma.pagos.create).not.toHaveBeenCalled();
  });

  it("rejects a payment when the order already has the maximum number of payments", async () => {
    (prisma.pagos.count as jest.Mock).mockResolvedValue(MAX_PAGOS_POR_PEDIDO);

    await expect(createPago(baseInput)).rejects.toBeInstanceOf(ValidationError);
    expect(prisma.pagos.create).not.toHaveBeenCalled();
  });

  it("rejects a payment when the order is already fully paid", async () => {
    sumPagado = 10000; // net 10000 == total

    await expect(createPago(baseInput)).rejects.toBeInstanceOf(ValidationError);
    expect(prisma.pagos.create).not.toHaveBeenCalled();
  });

  it("rejects a payment that exceeds the remaining balance", async () => {
    sumPagado = 9000; // remaining = 1000, baseInput pays 1500

    await expect(createPago(baseInput)).rejects.toBeInstanceOf(ValidationError);
    expect(prisma.pagos.create).not.toHaveBeenCalled();
  });

  it("allows a payment that exactly covers the remaining balance", async () => {
    sumPagado = 8500; // remaining = 1500, baseInput pays exactly 1500

    await expect(createPago(baseInput)).resolves.toMatchObject({ id_pago: 9 });
    expect(prisma.pagos.create).toHaveBeenCalled();
  });

  describe("refunds", () => {
    const refundInput: CreatePagoInput = {
      ...baseInput,
      monto_pago: 4000,
      estatus_pago: "Reembolsado",
    };

    it("registers a refund and bypasses the payment-count cap", async () => {
      sumPagado = 10000; // fully paid → refund allowed
      (prisma.pagos.count as jest.Mock).mockResolvedValue(MAX_PAGOS_POR_PEDIDO);

      await createPago(refundInput);

      expect(prisma.pagos.count).not.toHaveBeenCalled();
      expect(prisma.pagos.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estatus_pago: "Reembolsado", monto_pago: 4000 }),
        })
      );
    });

    it("rejects a refund when nothing has been collected", async () => {
      sumPagado = 0;

      await expect(createPago(refundInput)).rejects.toBeInstanceOf(ValidationError);
      expect(prisma.pagos.create).not.toHaveBeenCalled();
    });

    it("rejects a refund larger than the net collected amount", async () => {
      sumPagado = 3000; // refund of 4000 exceeds it

      await expect(createPago(refundInput)).rejects.toBeInstanceOf(ValidationError);
      expect(prisma.pagos.create).not.toHaveBeenCalled();
    });
  });
});

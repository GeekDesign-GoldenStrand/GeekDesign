import { prisma } from "@/lib/db/client";
import { MAX_PAGOS_POR_PEDIDO } from "@/lib/schemas/pagos";
import type { CreatePagoInput } from "@/lib/schemas/pagos";
import { createPago } from "@/lib/services/pagos";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    pedidos: { findUnique: jest.fn() },
    pagos: { create: jest.fn(), count: jest.fn() },
  },
}));

const baseInput: CreatePagoInput = {
  id_pedido: 1,
  monto_pago: 1500,
  metodo_pago: "transferencia",
  estatus_pago: "Pagado",
};

describe("createPago", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: order exists and is under the payment cap.
    (prisma.pedidos.findUnique as jest.Mock).mockResolvedValue({ id_pedido: 1 });
    (prisma.pagos.count as jest.Mock).mockResolvedValue(0);
  });

  it("creates a payment when the parent order exists", async () => {
    (prisma.pagos.create as jest.Mock).mockResolvedValue({ id_pago: 9, ...baseInput });

    const result = await createPago(baseInput);

    expect(prisma.pagos.create).toHaveBeenCalledWith({
      data: {
        id_pedido: 1,
        monto_pago: 1500,
        metodo_pago: "transferencia",
        estatus_pago: "Pagado",
        referencia_mercadopago: null,
      },
    });
    expect(result).toMatchObject({ id_pago: 9 });
  });

  it("throws NotFoundError when the order does not exist", async () => {
    (prisma.pedidos.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(createPago(baseInput)).rejects.toBeInstanceOf(NotFoundError);
    expect(prisma.pagos.create).not.toHaveBeenCalled();
  });

  it("rejects when the order already has the maximum number of payments", async () => {
    (prisma.pagos.count as jest.Mock).mockResolvedValue(MAX_PAGOS_POR_PEDIDO);

    await expect(createPago(baseInput)).rejects.toBeInstanceOf(ValidationError);
    expect(prisma.pagos.create).not.toHaveBeenCalled();
  });

  it("persists the Mercado Pago reference when provided", async () => {
    (prisma.pedidos.findUnique as jest.Mock).mockResolvedValue({ id_pedido: 1 });
    (prisma.pagos.create as jest.Mock).mockResolvedValue({ id_pago: 10 });

    await createPago({
      ...baseInput,
      metodo_pago: "Mercado Pago",
      referencia_mercadopago: "MP-123",
    });

    expect(prisma.pagos.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ referencia_mercadopago: "MP-123" }),
      })
    );
  });
});

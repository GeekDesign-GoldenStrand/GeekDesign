import { prisma } from "@/lib/db/client";
import type { CreatePagoInput } from "@/lib/schemas/pagos";
import { createPago } from "@/lib/services/pagos";
import { NotFoundError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    pedidos: { findUnique: jest.fn() },
    pagos: { create: jest.fn() },
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
  });

  it("creates a payment when the parent order exists", async () => {
    (prisma.pedidos.findUnique as jest.Mock).mockResolvedValue({ id_pedido: 1 });
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

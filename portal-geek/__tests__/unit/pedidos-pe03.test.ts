/**
 * @jest-environment node
 */

import { prisma } from "@/lib/db/client";
import { changeDetallePedidoStatus, listPedidos, PEDIDO_STATUS } from "@/lib/services/pedidos";

jest.mock("@/lib/db/client", () => {
  const mockPrisma = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([]),

    pedidos: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },

    detallePedido: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },

    estatusPedidos: {
      findUnique: jest.fn(),
    },
  };

  mockPrisma.$transaction.mockImplementation(
    async (
      callback: ((tx: typeof mockPrisma) => Promise<unknown> | unknown) | Promise<unknown>[]
    ) => {
      if (typeof callback === "function") {
        return callback(mockPrisma);
      }

      return Promise.all(callback);
    }
  );

  return {
    prisma: mockPrisma,
  };
});

describe("listPedidos - PE-03 service status summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.pedidos.count as jest.Mock).mockResolvedValue(1);
  });

  it("filters pedidos by serviceId through DetallePedido", async () => {
    (prisma.pedidos.findMany as jest.Mock).mockResolvedValue([]);

    await listPedidos(1, 10, [1], [], false, null, null, null);

    expect(prisma.pedidos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          detalles: {
            some: {
              id_servicio: {
                in: [1],
              },
            },
          },
        },
      })
    );

    expect(prisma.pedidos.count).toHaveBeenCalledWith({
      where: {
        detalles: {
          some: {
            id_servicio: {
              in: [1],
            },
          },
        },
      },
    });
  });

  it("builds serviceStatusSummary from detail statuses", async () => {
    (prisma.pedidos.findMany as jest.Mock).mockResolvedValue([
      {
        id_pedido: 1,
        detalles: [
          {
            id_detalle: 1,
            estatus: { descripcion: PEDIDO_STATUS.PENDIENTE },
          },
          {
            id_detalle: 2,
            estatus: { descripcion: PEDIDO_STATUS.EN_PRODUCCION },
          },
          {
            id_detalle: 3,
            estatus: { descripcion: PEDIDO_STATUS.EN_PRODUCCION },
          },
          {
            id_detalle: 4,
            estatus: { descripcion: PEDIDO_STATUS.FINALIZADO },
          },
        ],
      },
    ]);

    const result = await listPedidos(1, 10);

    expect(result.items[0].serviceStatusSummary).toEqual({
      [PEDIDO_STATUS.PENDIENTE]: 1,
      [PEDIDO_STATUS.EN_PRODUCCION]: 2,
      [PEDIDO_STATUS.FINALIZADO]: 1,
      [PEDIDO_STATUS.ENTREGADO]: 0,
      [PEDIDO_STATUS.CANCELADO]: 0,
    });
  });

  it("counts details without status as Pendiente", async () => {
    (prisma.pedidos.findMany as jest.Mock).mockResolvedValue([
      {
        id_pedido: 1,
        detalles: [
          {
            id_detalle: 1,
            estatus: null,
          },
          {
            id_detalle: 2,
            estatus: { descripcion: PEDIDO_STATUS.CANCELADO },
          },
        ],
      },
    ]);

    const result = await listPedidos(1, 10);

    expect(result.items[0].serviceStatusSummary).toEqual({
      [PEDIDO_STATUS.PENDIENTE]: 1,
      [PEDIDO_STATUS.EN_PRODUCCION]: 0,
      [PEDIDO_STATUS.FINALIZADO]: 0,
      [PEDIDO_STATUS.ENTREGADO]: 0,
      [PEDIDO_STATUS.CANCELADO]: 1,
    });
  });
});

describe("changeDetallePedidoStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.estatusPedidos.findUnique as jest.Mock).mockResolvedValue({
      id_estatus: 2,
      descripcion: PEDIDO_STATUS.EN_PRODUCCION,
    });

    (prisma.detallePedido.update as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_pedido: 1,
      id_estatus: 2,
      id_usuario_modificacion: 99,
    });

    // Default case: not all details are final, so the parent pedido should not be closed.
    (prisma.detallePedido.findMany as jest.Mock).mockResolvedValue([
      {
        id_detalle: 1,
        estatus: {
          descripcion: PEDIDO_STATUS.EN_PRODUCCION,
        },
      },
      {
        id_detalle: 2,
        estatus: {
          descripcion: PEDIDO_STATUS.PENDIENTE,
        },
      },
    ]);

    (prisma.pedidos.update as jest.Mock).mockResolvedValue({
      id_pedido: 1,
      id_estatus: 2,
    });
  });

  it("updates a detalle pedido status and persists audit data", async () => {
    (prisma.detallePedido.findUnique as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_pedido: 1,
      id_estatus: 1,
      estatus: {
        descripcion: PEDIDO_STATUS.PENDIENTE,
      },
    });

    const result = await changeDetallePedidoStatus(1, PEDIDO_STATUS.EN_PRODUCCION, 99);

    expect(prisma.estatusPedidos.findUnique).toHaveBeenCalledWith({
      where: {
        descripcion: PEDIDO_STATUS.EN_PRODUCCION,
      },
    });

    expect(prisma.detallePedido.update).toHaveBeenCalledWith({
      where: {
        id_detalle: 1,
      },
      data: {
        id_estatus: 2,
        id_usuario_modificacion: 99,
        fecha_modificacion: expect.any(Date),
      },
    });

    expect(prisma.pedidos.update).not.toHaveBeenCalled();

    expect(result).toEqual({
      id_detalle: 1,
      id_pedido: 1,
      id_estatus: 2,
      id_usuario_modificacion: 99,
    });
  });

  it("treats a detalle without current status as Pendiente", async () => {
    (prisma.detallePedido.findUnique as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_pedido: 1,
      id_estatus: null,
      estatus: null,
    });

    await changeDetallePedidoStatus(1, PEDIDO_STATUS.EN_PRODUCCION, 99);

    expect(prisma.detallePedido.update).toHaveBeenCalledWith({
      where: {
        id_detalle: 1,
      },
      data: {
        id_estatus: 2,
        id_usuario_modificacion: 99,
        fecha_modificacion: expect.any(Date),
      },
    });
  });

  it("throws when detalle pedido does not exist", async () => {
    (prisma.detallePedido.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(changeDetallePedidoStatus(999, PEDIDO_STATUS.EN_PRODUCCION, 99)).rejects.toThrow(
      "Detalle de pedido not found"
    );

    expect(prisma.detallePedido.update).not.toHaveBeenCalled();
    expect(prisma.pedidos.update).not.toHaveBeenCalled();
  });

  it("prevents changing an Entregado detail to another status", async () => {
    (prisma.detallePedido.findUnique as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_pedido: 1,
      id_estatus: 4,
      estatus: {
        descripcion: PEDIDO_STATUS.ENTREGADO,
      },
    });

    await expect(changeDetallePedidoStatus(1, PEDIDO_STATUS.PENDIENTE, 99)).rejects.toThrow(
      "No se puede cambiar el estatus de un servicio que ya está 'Entregado'"
    );

    expect(prisma.detallePedido.update).not.toHaveBeenCalled();
    expect(prisma.pedidos.update).not.toHaveBeenCalled();
  });

  it("prevents changing a Cancelado detail to another status", async () => {
    (prisma.detallePedido.findUnique as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_pedido: 1,
      id_estatus: 5,
      estatus: {
        descripcion: PEDIDO_STATUS.CANCELADO,
      },
    });

    await expect(changeDetallePedidoStatus(1, PEDIDO_STATUS.PENDIENTE, 99)).rejects.toThrow(
      "No se puede cambiar el estatus de un servicio que ya está 'Cancelado'"
    );

    expect(prisma.detallePedido.update).not.toHaveBeenCalled();
    expect(prisma.pedidos.update).not.toHaveBeenCalled();
  });

  it("allows keeping the same final status and persists audit data", async () => {
    (prisma.estatusPedidos.findUnique as jest.Mock).mockResolvedValue({
      id_estatus: 4,
      descripcion: PEDIDO_STATUS.ENTREGADO,
    });

    (prisma.detallePedido.findUnique as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_pedido: 1,
      id_estatus: 4,
      estatus: {
        descripcion: PEDIDO_STATUS.ENTREGADO,
      },
    });

    (prisma.detallePedido.findMany as jest.Mock).mockResolvedValue([
      {
        id_detalle: 1,
        estatus: {
          descripcion: PEDIDO_STATUS.ENTREGADO,
        },
      },
      {
        id_detalle: 2,
        estatus: {
          descripcion: PEDIDO_STATUS.CANCELADO,
        },
      },
    ]);

    await changeDetallePedidoStatus(1, PEDIDO_STATUS.ENTREGADO, 99);

    expect(prisma.detallePedido.update).toHaveBeenCalledWith({
      where: {
        id_detalle: 1,
      },
      data: {
        id_estatus: 4,
        id_usuario_modificacion: 99,
        fecha_modificacion: expect.any(Date),
      },
    });

    expect(prisma.pedidos.update).toHaveBeenCalledWith({
      where: {
        id_pedido: 1,
      },
      data: {
        id_estatus: 4,
      },
    });
  });

  it("throws when target status does not exist in catalog", async () => {
    (prisma.detallePedido.findUnique as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_pedido: 1,
      id_estatus: 1,
      estatus: {
        descripcion: PEDIDO_STATUS.PENDIENTE,
      },
    });

    (prisma.estatusPedidos.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(changeDetallePedidoStatus(1, PEDIDO_STATUS.EN_PRODUCCION, 99)).rejects.toThrow(
      "Pedido status 'En producción' not found"
    );

    expect(prisma.detallePedido.update).not.toHaveBeenCalled();
    expect(prisma.pedidos.update).not.toHaveBeenCalled();
  });

  it("marks pedido as Entregado when all details are final and at least one is delivered", async () => {
    (prisma.detallePedido.findUnique as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_pedido: 10,
      id_estatus: 3,
      estatus: {
        descripcion: PEDIDO_STATUS.FINALIZADO,
      },
    });

    (prisma.detallePedido.findMany as jest.Mock).mockResolvedValue([
      {
        id_detalle: 1,
        estatus: {
          descripcion: PEDIDO_STATUS.ENTREGADO,
        },
      },
      {
        id_detalle: 2,
        estatus: {
          descripcion: PEDIDO_STATUS.CANCELADO,
        },
      },
    ]);

    (prisma.estatusPedidos.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id_estatus: 4,
        descripcion: PEDIDO_STATUS.ENTREGADO,
      })
      .mockResolvedValueOnce({
        id_estatus: 4,
        descripcion: PEDIDO_STATUS.ENTREGADO,
      });

    await changeDetallePedidoStatus(1, PEDIDO_STATUS.ENTREGADO, 99);

    expect(prisma.detallePedido.update).toHaveBeenCalledWith({
      where: {
        id_detalle: 1,
      },
      data: {
        id_estatus: 4,
        id_usuario_modificacion: 99,
        fecha_modificacion: expect.any(Date),
      },
    });

    expect(prisma.pedidos.update).toHaveBeenCalledWith({
      where: {
        id_pedido: 10,
      },
      data: {
        id_estatus: 4,
      },
    });
  });

  it("marks pedido as Cancelado when all details are canceled", async () => {
    (prisma.detallePedido.findUnique as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_pedido: 10,
      id_estatus: 1,
      estatus: {
        descripcion: PEDIDO_STATUS.PENDIENTE,
      },
    });

    (prisma.detallePedido.findMany as jest.Mock).mockResolvedValue([
      {
        id_detalle: 1,
        estatus: {
          descripcion: PEDIDO_STATUS.CANCELADO,
        },
      },
      {
        id_detalle: 2,
        estatus: {
          descripcion: PEDIDO_STATUS.CANCELADO,
        },
      },
    ]);

    (prisma.estatusPedidos.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id_estatus: 5,
        descripcion: PEDIDO_STATUS.CANCELADO,
      })
      .mockResolvedValueOnce({
        id_estatus: 5,
        descripcion: PEDIDO_STATUS.CANCELADO,
      });

    await changeDetallePedidoStatus(1, PEDIDO_STATUS.CANCELADO, 99);

    expect(prisma.detallePedido.update).toHaveBeenCalledWith({
      where: {
        id_detalle: 1,
      },
      data: {
        id_estatus: 5,
        id_usuario_modificacion: 99,
        fecha_modificacion: expect.any(Date),
      },
    });

    expect(prisma.pedidos.update).toHaveBeenCalledWith({
      where: {
        id_pedido: 10,
      },
      data: {
        id_estatus: 5,
      },
    });
  });

  it("does not mark pedido as final when at least one detail is not final", async () => {
    (prisma.detallePedido.findUnique as jest.Mock).mockResolvedValue({
      id_detalle: 1,
      id_pedido: 10,
      id_estatus: 1,
      estatus: {
        descripcion: PEDIDO_STATUS.PENDIENTE,
      },
    });

    (prisma.detallePedido.findMany as jest.Mock).mockResolvedValue([
      {
        id_detalle: 1,
        estatus: {
          descripcion: PEDIDO_STATUS.ENTREGADO,
        },
      },
      {
        id_detalle: 2,
        estatus: {
          descripcion: PEDIDO_STATUS.EN_PRODUCCION,
        },
      },
    ]);

    await changeDetallePedidoStatus(1, PEDIDO_STATUS.ENTREGADO, 99);

    expect(prisma.pedidos.update).not.toHaveBeenCalled();
  });
});

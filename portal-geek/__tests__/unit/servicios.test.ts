/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { Prisma } from "@prisma/client";

import { listServicios, getServicio, getServicioWithDetails, deleteServicio } from "@/lib/services/servicios";
import { NotFoundError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    servicios: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    detallePedido:{
      count: jest.fn(),
    },
  },
}));

const mockFindMany = prisma.servicios.findMany as jest.Mock;
const mockCount = prisma.servicios.count as jest.Mock;
const mockFindUnique = prisma.servicios.findUnique as jest.Mock;
const mockFindFirst = prisma.servicios.findFirst as jest.Mock;
const mockUpdate = prisma.servicios.update as jest.Mock;
const mockDetallePedidoCount = prisma.detallePedido.count as jest.Mock;

describe("listServicios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna items y total correctamente", async () => {
    mockFindMany.mockResolvedValue([{ id_servicio: 1, nombre_servicio: "Corte Láser" }]);
    mockCount.mockResolvedValue(1);

    const result = await listServicios(1, 20);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
  });

  it("filtra solo servicios activos cuando soloActivos es true", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await listServicios(1, 20, true);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { estatus_servicio: true } })
    );
  });

  it("aplica paginación correctamente en página 2", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(25);

    const result = await listServicios(2, 10);
    expect(result.total).toBe(25);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
  });

  it("filtra por query de búsqueda", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await listServicios(1, 20, false, "láser");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              nombre_servicio: { contains: "láser", mode: "insensitive" },
            }),
          ]),
        }),
      })
    );
  });

  it("combina filtro activo + query", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await listServicios(1, 20, true, "corte");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          estatus_servicio: true,
          OR: expect.any(Array),
        }),
      })
    );
  });
});

describe("getServicio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna el servicio cuando existe", async () => {
    const servicio = { id_servicio: 1, nombre_servicio: "Corte Láser" };
    mockFindUnique.mockResolvedValue(servicio);

    const result = await getServicio(1);
    expect(result).toEqual(servicio);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id_servicio: 1 } });
  });

  it("lanza NotFoundError cuando no existe", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(getServicio(999)).rejects.toThrow(NotFoundError);
  });
});

describe("getServicioWithDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna servicio con precioBase calculado", async () => {
    mockFindFirst.mockResolvedValue({
      id_servicio: 1,
      nombre_servicio: "Corte Láser",
      opciones: [
        {
          material: { id_material: 1 },
          valores: [
            {
              es_default: true,
              matriz: [{ precio_unitario: 150 }, { precio_unitario: 100 }],
            },
          ],
        },
      ],
    });

    const result = await getServicioWithDetails(1);
    expect(result.servicio.id_servicio).toBe(1);
    expect(result.precioBase).toBe(100);
  });

  it("retorna precioBase null cuando no hay precios", async () => {
    mockFindFirst.mockResolvedValue({
      id_servicio: 2,
      nombre_servicio: "Bordado",
      opciones: [],
    });

    const result = await getServicioWithDetails(2);
    expect(result.precioBase).toBeNull();
  });

  it("lanza NotFoundError cuando el servicio no existe o está inactivo", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(getServicioWithDetails(999)).rejects.toThrow(NotFoundError);
  });
});

describe("deleteServicio (soft delete)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDetallePedidoCount.mockResolvedValue(0);
  });

  it("hace soft delete: llama update con estatus_servicio: false", async () => {
    mockUpdate.mockResolvedValue({ id_servicio: 1, estatus_servicio: false });

    await deleteServicio(1);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id_servicio: 1 },
      data: { estatus_servicio: false },
    });
  });

  it("verifica primero si hay pedidos activos referenciando el servicio", async () => {
    mockUpdate.mockResolvedValue({ id_servicio: 1, estatus_servicio: false });

    await deleteServicio(1);

    expect(mockDetallePedidoCount).toHaveBeenCalledWith({
      where: {
        id_servicio: 1,
        pedido: {
          estatus: {
            descripcion: { notIn: ["Entregado", "Facturado"] },
          },
        },
      },
    });
  });

  it("lanza ConflictError cuando el servicio tiene pedidos en proceso", async () => {
    mockDetallePedidoCount.mockResolvedValue(3);

    await expect(deleteServicio(1)).rejects.toThrow(
      "No se puede eliminar: el servicio está referenciado en 3 pedido(s) en proceso."
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("lanza NotFoundError cuando el servicio no existe (P2025)", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "7.8.0",
    });
    mockUpdate.mockRejectedValue(prismaError);

    await expect(deleteServicio(999)).rejects.toThrow(NotFoundError);
    await expect(deleteServicio(999)).rejects.toThrow("999");
  });

  it("propaga errores distintos a P2025", async () => {
    mockUpdate.mockRejectedValue(new Error("Error de base de datos"));

    await expect(deleteServicio(1)).rejects.toThrow("Error de base de datos");
  });
});

/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { listServicios, getServicio, getServicioWithDetails } from "@/lib/services/servicios";
import { NotFoundError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    servicios: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

const mockFindMany = prisma.servicios.findMany as jest.Mock;
const mockCount = prisma.servicios.count as jest.Mock;
const mockFindUnique = prisma.servicios.findUnique as jest.Mock;
const mockFindFirst = prisma.servicios.findFirst as jest.Mock;

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

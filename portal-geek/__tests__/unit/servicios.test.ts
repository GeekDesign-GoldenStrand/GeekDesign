/**
 * @jest-environment node
 */
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import {
  listServicios,
  getServicio,
  getServicioWithDetails,
  deleteServicio,
} from "@/lib/services/servicios";
import { NotFoundError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    servicios: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindMany = prisma.servicios.findMany as jest.Mock;
const mockCount = prisma.servicios.count as jest.Mock;
const mockFindUnique = prisma.servicios.findUnique as jest.Mock;
const mockFindFirst = prisma.servicios.findFirst as jest.Mock;
const mockUpdate = prisma.servicios.update as jest.Mock;

const SERVICIO = {
  id_servicio: 1,
  id_estatus: 1,
  id_sucursal: 1,
  id_instalador: null,
  id_proveedor: null,
  nombre_servicio: "Corte Láser",
  descripcion_servicio: "Corte con láser CO2",
  estatus_servicio: true,
  costo_instalador_override: null,
  costo_proveedor_override: null,
  fecha_modificacion: new Date("2026-05-08"),
  sucursal: { id_sucursal: 1, nombre_sucursal: "Sucursal Principal" },
  maquinas: [],
};

const SERVICIO_COMPLETO = {
  ...SERVICIO,
  estatusServicio: { id_estatus_servicio: 1, descripcion: "Activo" },
  instalador: null,
  proveedor: null,
  formulas: [],
};

const SERVICIO_CON_DETALLES = {
  ...SERVICIO,
  opciones: [
    {
      id_opcion: 1,
      nombre_opcion: "Tamaño",
      material: { id_material: 1, nombre_material: "MDF 3mm" },
      valores: [
        {
          id_valor: 1,
          valor: "chico",
          es_default: true,
          matriz: [
            { id_precio: 1, precio_unitario: 25.0 },
            { id_precio: 2, precio_unitario: 20.0 },
          ],
        },
      ],
    },
  ],
};

describe("listServicios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation((promises: Promise<unknown>[]) => Promise.all(promises));
  });

  it("retorna items y total correctamente", async () => {
    mockFindMany.mockResolvedValue([SERVICIO]);
    mockCount.mockResolvedValue(1);

    const result = await listServicios(1, 20);

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("aplica paginación correctamente en página 2", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(25);

    await listServicios(2, 10);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });

  it("aplica paginación correctamente en página 1", async () => {
    mockFindMany.mockResolvedValue([SERVICIO]);
    mockCount.mockResolvedValue(1);

    await listServicios(1, 20);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    );
  });

  it("retorna lista vacía cuando no hay servicios", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const result = await listServicios(1, 20);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("filtra por estatus_servicio: true cuando soloActivos=true", async () => {
    mockFindMany.mockResolvedValue([SERVICIO]);
    mockCount.mockResolvedValue(1);

    await listServicios(1, 20, true);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estatus_servicio: true }),
      })
    );
  });

  it("aplica búsqueda por query en nombre y descripción (case-insensitive)", async () => {
    mockFindMany.mockResolvedValue([SERVICIO]);
    mockCount.mockResolvedValue(1);

    await listServicios(1, 20, false, "láser");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { nombre_servicio: { contains: "láser", mode: "insensitive" } },
            { descripcion_servicio: { contains: "láser", mode: "insensitive" } },
          ],
        }),
      })
    );
  });

  it("ordena por fecha_modificacion descendente", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await listServicios(1, 20);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { fecha_modificacion: "desc" } })
    );
  });
});

describe("getServicio", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna el servicio cuando existe", async () => {
    mockFindUnique.mockResolvedValue(SERVICIO_COMPLETO);

    const result = await getServicio(1);

    expect(result).toEqual(SERVICIO_COMPLETO);
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_servicio: 1 } })
    );
  });

  it("incluye relaciones esperadas (estatusServicio, sucursal, instalador, proveedor)", async () => {
    mockFindUnique.mockResolvedValue(SERVICIO_COMPLETO);

    await getServicio(1);

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          estatusServicio: true,
          sucursal: true,
          instalador: true,
          proveedor: true,
        }),
      })
    );
  });

  it("solo incluye fórmulas con estatus Activa", async () => {
    mockFindUnique.mockResolvedValue(SERVICIO_COMPLETO);

    await getServicio(1);

    const callArg = mockFindUnique.mock.calls[0][0];
    expect(callArg.include.formulas.where).toEqual({ estatus: "Activa" });
  });

  it("lanza NotFoundError cuando el servicio no existe", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(getServicio(999)).rejects.toThrow(NotFoundError);
  });

  it("el mensaje de NotFoundError incluye el id", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(getServicio(42)).rejects.toThrow("42");
  });
});

describe("getServicioWithDetails", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna el servicio y calcula precioBase como el mínimo de la matriz", async () => {
    mockFindFirst.mockResolvedValue(SERVICIO_CON_DETALLES);

    const result = await getServicioWithDetails(1);

    expect(result.servicio).toEqual(SERVICIO_CON_DETALLES);
    expect(result.precioBase).toBe(20.0);
  });

  it("retorna precioBase null cuando no hay matriz de precios", async () => {
    const sinPrecios = { ...SERVICIO_CON_DETALLES, opciones: [] };
    mockFindFirst.mockResolvedValue(sinPrecios);

    const result = await getServicioWithDetails(1);

    expect(result.precioBase).toBeNull();
  });

  it("filtra por estatus_servicio: true (no devuelve eliminados lógicamente)", async () => {
    mockFindFirst.mockResolvedValue(SERVICIO_CON_DETALLES);

    await getServicioWithDetails(1);

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_servicio: 1, estatus_servicio: true },
      })
    );
  });

  it("lanza NotFoundError cuando el servicio no existe o está inactivo", async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(getServicioWithDetails(999)).rejects.toThrow(NotFoundError);
  });
});

describe("deleteServicio (soft delete)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("hace soft delete: llama update con estatus_servicio: false", async () => {
    mockUpdate.mockResolvedValue({ ...SERVICIO, estatus_servicio: false });

    await deleteServicio(1);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id_servicio: 1 },
      data: { estatus_servicio: false },
    });
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
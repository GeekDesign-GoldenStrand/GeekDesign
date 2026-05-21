/**
 * @jest-environment node
 */
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import {
  listServicios,
  getServicio,
  getServicioWithDetails,
  getServicioParaAdmin,
  deleteServicio,
  updateServicio,
} from "@/lib/services/servicios";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
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
const mockQueryRaw = prisma.$queryRaw as unknown as jest.Mock;
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
  instalador: null,
  proveedor: null,
  formulas: [
    {
      id_formula: 1,
      id_servicio: 1,
      expresion: "ancho * alto * costo_laser",
      estatus: "Activa",
      id_usuario_creo: 1,
      variables: [
        {
          id_variable: 1,
          nombre_variable: "ancho",
          etiqueta: "Ancho (cm)",
          unidad: "cm",
          valor_default: "50",
          editable_por_cliente: true,
          tipo: { nombre_tipo: "Dimensión", unidad_default: "cm" },
        },
      ],
      constantes: [
        {
          id_constante: 1,
          nombre_constante: "costo_laser",
          origen: "manual",
          valor: "2.5",
          instalador: null,
          proveedor: null,
        },
      ],
    },
  ],
  servicioMateriales: [
    {
      id_servicio_material: 1,
      id_material: 1,
      id_proveedor_precio: 1,
      material: { id_material: 1, nombre_material: "MDF 3mm" },
      proveedorPrecio: { id_proveedor_precio: 1, precio: "200" },
    },
  ],
};

const SERVICIO_PARA_ADMIN_MOCK = {
  id_servicio: 1,
  id_estatus: 1,
  id_sucursal: 1,
  id_instalador: null,
  id_proveedor: null,
  nombre_servicio: "Corte Láser",
  descripcion_servicio: "Corte con láser CO2",
  estatus_servicio: true,
  imagen_url: null,
  costo_instalador_override: null,
  costo_proveedor_override: null,
  fecha_modificacion: new Date("2026-05-08"),
  sucursal: { id_sucursal: 1, nombre_sucursal: "Sucursal Principal" },
  maquinas: [],
  instalador: null,
  proveedor: null,
  formulas: [],
  servicioMateriales: [],
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

    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
  });

  it("aplica paginación correctamente en página 1", async () => {
    mockFindMany.mockResolvedValue([SERVICIO]);
    mockCount.mockResolvedValue(1);

    await listServicios(1, 20);

    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
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

  it("ST-18: usa $queryRaw con unaccent para búsqueda accent/case-insensitive", async () => {
    mockQueryRaw.mockResolvedValue([{ id_servicio: 1 }]);
    mockFindMany.mockResolvedValue([SERVICIO]);

    const result = await listServicios(1, 20, false, "láser");

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_servicio: { in: [1] } },
      })
    );
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("ST-18: retorna vacío y NO llama findMany cuando no hay matches", async () => {
    mockQueryRaw.mockResolvedValue([]);

    const result = await listServicios(1, 20, false, "xyz");

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [], total: 0 });
  });

  it("ST-18: query con solo espacios cae al path no-query (no llama $queryRaw)", async () => {
    mockFindMany.mockResolvedValue([SERVICIO]);
    mockCount.mockResolvedValue(1);

    await listServicios(1, 20, false, "   ");

    expect(mockQueryRaw).not.toHaveBeenCalled();
    expect(mockFindMany).toHaveBeenCalled();
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

  it("retorna el servicio con su formula activa y materiales", async () => {
    mockFindFirst.mockResolvedValue(SERVICIO_CON_DETALLES);

    const result = await getServicioWithDetails(1);

    expect(result.servicio).toEqual(SERVICIO_CON_DETALLES);
    expect(result.servicio.formulas).toHaveLength(1);
    expect(result.servicio.servicioMateriales).toHaveLength(1);
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

  // KIKW12 review #5: when a servicio has no Activa formula the loader now
  // returns the servicio (with formulas: []) instead of throwing. The detail
  // page renders a "Cotización en línea no disponible" fallback in place of
  // the variables form so the catalog card still resolves.
  it("returns servicio with empty formulas[] when no Activa formula exists (no longer throws)", async () => {
    const sinFormula = { ...SERVICIO_CON_DETALLES, formulas: [] };
    mockFindFirst.mockResolvedValue(sinFormula);

    const result = await getServicioWithDetails(1);
    expect(result.servicio.formulas).toEqual([]);
    expect(result.servicio.id_servicio).toBe(1);
  });
});

describe("getServicioParaAdmin", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna el servicio cuando existe y está activo", async () => {
    mockFindFirst.mockResolvedValue(SERVICIO_PARA_ADMIN_MOCK);

    const result = await getServicioParaAdmin(1);

    expect(result).toEqual(SERVICIO_PARA_ADMIN_MOCK);
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_servicio: 1, estatus_servicio: true } })
    );
  });

  it("incluye relaciones esperadas (sucursal, instalador, proveedor, servicioMateriales)", async () => {
    mockFindFirst.mockResolvedValue(SERVICIO_PARA_ADMIN_MOCK);

    await getServicioParaAdmin(1);

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          sucursal: true,
          instalador: true,
          proveedor: true,
        }),
      })
    );
  });

  it("solo incluye fórmulas con estatus Activa", async () => {
    mockFindFirst.mockResolvedValue(SERVICIO_PARA_ADMIN_MOCK);

    await getServicioParaAdmin(1);

    const callArg = mockFindFirst.mock.calls[0][0];
    expect(callArg.include.formulas.where).toEqual({ estatus: "Activa" });
  });

  it("lanza NotFoundError cuando el servicio no existe o está inactivo", async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(getServicioParaAdmin(999)).rejects.toThrow(NotFoundError);
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

describe("updateServicio", () => {
  const mockTx = {
    servicios: { update: jest.fn() },
    servicioMaquina: { deleteMany: jest.fn(), createMany: jest.fn() },
    servicioMaterial: { deleteMany: jest.fn(), createMany: jest.fn() },
    formulas: { findMany: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
    formulaVariables: { updateMany: jest.fn(), createMany: jest.fn() },
    formulaConstantes: { createMany: jest.fn() },
    sucursales: { findFirst: jest.fn() },
    instaladores: { findFirst: jest.fn() },
    proveedores: { findFirst: jest.fn() },
    maquinas: { findMany: jest.fn() },
    materiales: { findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFirst.mockResolvedValue(SERVICIO_PARA_ADMIN_MOCK);
    mockTransaction.mockImplementation(async (callback: (tx: typeof mockTx) => Promise<unknown>) =>
      callback(mockTx)
    );
    mockTx.servicios.update.mockResolvedValue(SERVICIO);
    mockTx.formulas.create.mockResolvedValue({ id_formula: 99, estatus: "Activa" });
    mockTx.sucursales.findFirst.mockResolvedValue({ id_sucursal: 1 });
    mockTx.instaladores.findFirst.mockResolvedValue({ id_instalador: 1 });
    mockTx.proveedores.findFirst.mockResolvedValue({ id_proveedor: 1 });
    mockTx.maquinas.findMany.mockResolvedValue([]);
    mockTx.materiales.findMany.mockResolvedValue([]);
  });

  it("lanza NotFoundError antes de la transaction si el servicio no existe", async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(updateServicio(999, { nombre_servicio: "Nuevo" }, 1)).rejects.toThrow(
      NotFoundError
    );

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("deactiva las FormulaVariables de las fórmulas activas antes de deactivarlas", async () => {
    mockTx.formulas.findMany.mockResolvedValue([{ id_formula: 1 }, { id_formula: 2 }]);

    await updateServicio(1, { formula: { expresion: "x", variables: [], constantes: [] } }, 1);

    expect(mockTx.formulaVariables.updateMany).toHaveBeenCalledWith({
      where: { id_formula: { in: [1, 2] } },
      data: { estatus: "Inactivo" },
    });
    expect(mockTx.formulas.updateMany).toHaveBeenCalledWith({
      where: { id_servicio: 1, estatus: "Activa" },
      data: { estatus: "Inactiva" },
    });
  });

  it("no llama formulaVariables.updateMany si no hay fórmulas activas", async () => {
    mockTx.formulas.findMany.mockResolvedValue([]);

    await updateServicio(1, { formula: { expresion: "x", variables: [], constantes: [] } }, 1);

    expect(mockTx.formulaVariables.updateMany).not.toHaveBeenCalled();
  });

  it("el orden correcto: deactiva variables → deactiva fórmulas → crea nueva fórmula", async () => {
    const calls: string[] = [];
    mockTx.formulas.findMany.mockResolvedValue([{ id_formula: 5 }]);
    mockTx.formulaVariables.updateMany.mockImplementation(() => {
      calls.push("variables.updateMany");
      return Promise.resolve({ count: 2 });
    });
    mockTx.formulas.updateMany.mockImplementation(() => {
      calls.push("formulas.updateMany");
      return Promise.resolve({ count: 1 });
    });
    mockTx.formulas.create.mockImplementation(() => {
      calls.push("formulas.create");
      return Promise.resolve({ id_formula: 99 });
    });

    await updateServicio(1, { formula: { expresion: "x", variables: [], constantes: [] } }, 1);

    expect(calls).toEqual(["variables.updateMany", "formulas.updateMany", "formulas.create"]);
  });

  it("sincroniza materiales: delete + insert cuando materiales viene en el payload", async () => {
    const materiales = [
      { id_material: 10, id_proveedor_precio: null },
      { id_material: 20, id_proveedor_precio: 5 },
    ];
    mockTx.materiales.findMany.mockResolvedValue([{ id_material: 10 }, { id_material: 20 }]);

    await updateServicio(1, { materiales }, 1);

    expect(mockTx.servicioMaterial.deleteMany).toHaveBeenCalledWith({ where: { id_servicio: 1 } });
    expect(mockTx.servicioMaterial.createMany).toHaveBeenCalledWith({
      data: [
        { id_servicio: 1, id_material: 10, id_proveedor_precio: null },
        { id_servicio: 1, id_material: 20, id_proveedor_precio: 5 },
      ],
    });
  });

  it("no toca servicioMaterial cuando materiales no viene en el payload", async () => {
    await updateServicio(1, { nombre_servicio: "Nuevo nombre" }, 1);

    expect(mockTx.servicioMaterial.deleteMany).not.toHaveBeenCalled();
    expect(mockTx.servicioMaterial.createMany).not.toHaveBeenCalled();
  });

  it("solo hace deleteMany si materiales es array vacío (limpiar todos)", async () => {
    await updateServicio(1, { materiales: [] }, 1);

    expect(mockTx.servicioMaterial.deleteMany).toHaveBeenCalledWith({ where: { id_servicio: 1 } });
    expect(mockTx.servicioMaterial.createMany).not.toHaveBeenCalled();
  });

  it("lanza ValidationError si id_sucursal no existe (FK validation)", async () => {
    mockTx.sucursales.findFirst.mockResolvedValue(null);

    await expect(updateServicio(1, { id_sucursal: 99 }, 1)).rejects.toThrow(ValidationError);
  });

  it("lanza ValidationError si alguna máquina no existe", async () => {
    mockTx.maquinas.findMany.mockResolvedValue([{ id_maquina: 1 }]);

    await expect(updateServicio(1, { id_maquinas: [1, 999] }, 1)).rejects.toThrow(ValidationError);
  });

  it("no valida id_instalador si se envía null (desasignar)", async () => {
    await updateServicio(1, { id_instalador: null }, 1);

    expect(mockTx.instaladores.findFirst).not.toHaveBeenCalled();
  });
});

/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import {
  createProveedor,
  getProviderAssignments,
  syncProviderAssignments,
} from "@/lib/services/proveedores";
import { ValidationError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    proveedorPrecios: {
      findMany: jest.fn(),
    },
    proveedores: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    servicios: {
      findMany: jest.fn(),
    },
    materiales: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockFindMany = prisma.proveedorPrecios.findMany as jest.Mock;
const mockFindUniqueProveedor = prisma.proveedores.findUnique as jest.Mock;
const mockFindFirstProveedor = prisma.proveedores.findFirst as jest.Mock;
const mockCreateProveedor = prisma.proveedores.create as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

describe("getProviderAssignments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna serviceIds, materialIds y prices correctamente mapeados", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([
      { id_servicio: 1, id_material: null, precio: 150, notas: "nota 1" },
      { id_servicio: null, id_material: 10, precio: 200, notas: "" },
      { id_servicio: 2, id_material: null, precio: 50, notas: null },
    ]);

    const result = await getProviderAssignments(1);

    expect(result.serviceIds).toEqual([1, 2]);
    expect(result.materialIds).toEqual([10]);
    expect(result.servicePrices).toEqual({ 1: 150, 2: 50 });
    expect(result.materialPrices).toEqual({ 10: 200 });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_proveedor: 1 } })
    );
  });

  it("retorna arreglos vacíos cuando no hay asignaciones", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 999 });
    mockFindMany.mockResolvedValue([]);

    const result = await getProviderAssignments(999);

    expect(result.serviceIds).toEqual([]);
    expect(result.materialIds).toEqual([]);
    expect(result.servicePrices).toEqual({});
    expect(result.materialPrices).toEqual({});
  });

  it("lanza NotFoundError si el proveedor no existe", async () => {
    mockFindUniqueProveedor.mockResolvedValue(null);
    await expect(getProviderAssignments(123)).rejects.toThrow("Proveedor 123 no encontrado");
  });
});

describe("syncProviderAssignments", () => {
  let mockTx: {
    proveedorPrecios: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      createMany: jest.Mock;
      update: jest.Mock;
    };
    gastos: { findMany: jest.Mock };
    servicios: { findMany: jest.Mock };
    materiales: { findMany: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx = {
      proveedorPrecios: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
      gastos: { findMany: jest.fn().mockResolvedValue([]) },
      servicios: { findMany: jest.fn() },
      materiales: { findMany: jest.fn() },
    };
    mockTransaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));
    mockTx.servicios.findMany.mockImplementation(
      (args: { where: { id_servicio: { in: number[] } } }) =>
        Promise.resolve(args.where.id_servicio.in.map((id: number) => ({ id_servicio: id })))
    );
    mockTx.materiales.findMany.mockImplementation(
      (args: { where: { id_material: { in: number[] } } }) =>
        Promise.resolve(args.where.id_material.in.map((id: number) => ({ id_material: id })))
    );
  });

  it("agrega servicios nuevos sin tocar los existentes", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockTx.proveedorPrecios.findMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 1, id_material: null },
    ]);

    await syncProviderAssignments(1, "servicio", [
      { id: 1, precio: 0 },
      { id: 5, precio: 50 },
    ]);

    expect(mockTx.proveedorPrecios.deleteMany).not.toHaveBeenCalled();
    expect(mockTx.proveedorPrecios.createMany).toHaveBeenCalledWith({
      data: [{ id_proveedor: 1, id_servicio: 5, id_material: null, precio: 50, notas: "" }],
      skipDuplicates: true,
    });
  });

  it("usa createMany en una sola llamada para múltiples adiciones", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockTx.proveedorPrecios.findMany.mockResolvedValue([]);

    await syncProviderAssignments(1, "material", [
      { id: 10, precio: 100 },
      { id: 20, precio: 200 },
    ]);

    expect(mockTx.proveedorPrecios.createMany).toHaveBeenCalledWith({
      data: [
        { id_proveedor: 1, id_servicio: null, id_material: 10, precio: 100, notas: "" },
        { id_proveedor: 1, id_servicio: null, id_material: 20, precio: 200, notas: "" },
      ],
      skipDuplicates: true,
    });
  });

  it("actualiza el precio si la asignación ya existe", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockTx.proveedorPrecios.findMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 1, id_material: null },
    ]);

    await syncProviderAssignments(1, "servicio", [{ id: 1, precio: 200, notas: "actualizado" }]);

    expect(mockTx.proveedorPrecios.deleteMany).not.toHaveBeenCalled();
    expect(mockTx.proveedorPrecios.createMany).not.toHaveBeenCalled();
    expect(mockTx.proveedorPrecios.update).toHaveBeenCalledWith({
      where: { id_proveedor_precio: 100 },
      data: expect.objectContaining({ precio: 200, notas: "actualizado" }),
    });
  });

  it("elimina asignaciones removidas que no tienen Gastos", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockTx.proveedorPrecios.findMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_material: 10, id_servicio: null },
    ]);

    await syncProviderAssignments(1, "material", [{ id: 20, precio: 75 }]);

    expect(mockTx.proveedorPrecios.deleteMany).toHaveBeenCalledWith({
      where: { id_proveedor_precio: { in: [100] } },
    });
    expect(mockTx.proveedorPrecios.createMany).toHaveBeenCalledWith({
      data: [{ id_proveedor: 1, id_servicio: null, id_material: 20, precio: 75, notas: "" }],
      skipDuplicates: true,
    });
  });

  it("no borra asignaciones referenciadas por Gastos", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockTx.proveedorPrecios.findMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 1, id_material: null },
      { id_proveedor_precio: 101, id_servicio: 2, id_material: null },
    ]);
    mockTx.gastos.findMany.mockResolvedValue([{ id_proveedor_precio: 101 }]);

    await syncProviderAssignments(1, "servicio", [{ id: 1, precio: 0 }]); // wants to remove service 2 (pk 101)

    expect(mockTx.proveedorPrecios.deleteMany).not.toHaveBeenCalled();
  });

  it("borra solo las asignaciones sin referencia en Gastos", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockTx.proveedorPrecios.findMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 1, id_material: null },
      { id_proveedor_precio: 101, id_servicio: 2, id_material: null },
    ]);
    mockTx.gastos.findMany.mockResolvedValue([{ id_proveedor_precio: 101 }]);

    await syncProviderAssignments(1, "servicio", [{ id: 2, precio: 0 }]); // keep 2 (pk 101 protected), remove 1 (pk 100)

    expect(mockTx.proveedorPrecios.deleteMany).toHaveBeenCalledWith({
      where: { id_proveedor_precio: { in: [100] } },
    });
  });

  it("elimina todas las asignaciones sin Gastos si el arreglo está vacío", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockTx.proveedorPrecios.findMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 1, id_material: null },
      { id_proveedor_precio: 101, id_servicio: 2, id_material: null },
    ]);

    await syncProviderAssignments(1, "servicio", []);

    expect(mockTx.proveedorPrecios.deleteMany).toHaveBeenCalledWith({
      where: { id_proveedor_precio: { in: [100, 101] } },
    });
    expect(mockTx.proveedorPrecios.createMany).not.toHaveBeenCalled();
  });

  it("lanza NotFoundError si el proveedor no existe al sincronizar", async () => {
    mockFindUniqueProveedor.mockResolvedValue(null);
    await expect(
      syncProviderAssignments(123, "servicio", [{ id: 1, precio: 100 }])
    ).rejects.toThrow("Proveedor 123 no encontrado");
  });

  it("lanza un error si la transacción falla", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockTransaction.mockRejectedValue(new Error("Transaction failed"));

    await expect(syncProviderAssignments(1, "servicio", [{ id: 5, precio: 100 }])).rejects.toThrow(
      "Transaction failed"
    );
  });

  it("lanza ValidationError si un id_servicio nuevo no existe o está inactivo", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    // proveedorPrecios.findMany returns [] (default) → id 99 is toAdd → validation fires
    mockTx.servicios.findMany.mockResolvedValue([]); // not found / inactive

    await expect(syncProviderAssignments(1, "servicio", [{ id: 99, precio: 100 }])).rejects.toThrow(
      ValidationError
    );
  });

  it("lanza ValidationError si un id_material nuevo no existe", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    // proveedorPrecios.findMany returns [] (default) → id 99 is toAdd → validation fires
    mockTx.materiales.findMany.mockResolvedValue([]); // not found

    await expect(syncProviderAssignments(1, "material", [{ id: 99, precio: 100 }])).rejects.toThrow(
      ValidationError
    );
  });

  it("permite re-sincronizar asignación de servicio existente aunque el servicio esté inactivo", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    // Service 7 already has a row — ends up in toUpdate, not toAdd
    mockTx.proveedorPrecios.findMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 7, id_material: null },
    ]);

    await expect(
      syncProviderAssignments(1, "servicio", [{ id: 7, precio: 500 }])
    ).resolves.toBeUndefined();

    // Validation query must not run — no new assignments
    expect(mockTx.servicios.findMany).not.toHaveBeenCalled();
    expect(mockTx.proveedorPrecios.update).toHaveBeenCalledWith({
      where: { id_proveedor_precio: 100 },
      data: { precio: 500, notas: "" },
    });
  });

  it("permite re-sincronizar asignación de material existente", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockTx.proveedorPrecios.findMany.mockResolvedValue([
      { id_proveedor_precio: 200, id_servicio: null, id_material: 15 },
    ]);

    await expect(
      syncProviderAssignments(1, "material", [{ id: 15, precio: 300 }])
    ).resolves.toBeUndefined();

    // Validation query must not run — no new assignments
    expect(mockTx.materiales.findMany).not.toHaveBeenCalled();
  });

  it("lanza ValidationError solo para el nuevo servicio inactivo, no para el existente inactivo", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    // Service 7: existing assignment (active status irrelevant); service 9: new + inactive
    mockTx.proveedorPrecios.findMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 7, id_material: null },
    ]);
    mockTx.servicios.findMany.mockResolvedValue([]); // service 9 not active

    await expect(
      syncProviderAssignments(1, "servicio", [
        { id: 7, precio: 100 }, // existing → exempt from active check
        { id: 9, precio: 200 }, // new + inactive → must reject
      ])
    ).rejects.toThrow(ValidationError);
  });
});

describe("createProveedor", () => {
  const baseInput = {
    nombre_proveedor: "Empresa Uno",
    tipo: "Proveedor de material",
    telefono: "4421230001",
    correo: "ventas@empresa.mx",
    estatus: "Activo" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("crea el proveedor cuando el correo no está en uso", async () => {
    mockFindFirstProveedor.mockResolvedValue(null);
    mockCreateProveedor.mockResolvedValue({ id_proveedor: 1, ...baseInput });

    const result = await createProveedor(baseInput);

    expect(result).toEqual(expect.objectContaining({ id_proveedor: 1 }));
    expect(mockCreateProveedor).toHaveBeenCalledTimes(1);
  });

  it("busca duplicados por correo (case-insensitive) entre proveedores no eliminados", async () => {
    mockFindFirstProveedor.mockResolvedValue(null);
    mockCreateProveedor.mockResolvedValue({ id_proveedor: 1, ...baseInput });

    await createProveedor(baseInput);

    expect(mockFindFirstProveedor).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          correo: { equals: baseInput.correo, mode: "insensitive" },
          estatus: { not: "Inactivo" },
        },
      })
    );
  });

  it("lanza ConflictError y no crea si ya existe un proveedor con ese correo", async () => {
    mockFindFirstProveedor.mockResolvedValue({ id_proveedor: 99 });

    await expect(createProveedor(baseInput)).rejects.toThrow(
      `Ya existe un proveedor con el correo "${baseInput.correo}".`
    );
    expect(mockCreateProveedor).not.toHaveBeenCalled();
  });

  it("permite el mismo nombre con un correo distinto", async () => {
    mockFindFirstProveedor.mockResolvedValue(null);
    mockCreateProveedor.mockResolvedValue({ id_proveedor: 2 });

    await expect(
      createProveedor({ ...baseInput, correo: "otro@empresa.mx" })
    ).resolves.toBeDefined();
    expect(mockCreateProveedor).toHaveBeenCalledTimes(1);
  });
});

/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { getProviderAssignments, syncProviderAssignments } from "@/lib/services/proveedores";
import { ValidationError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    proveedorPrecios: {
      findMany: jest.fn(),
    },
    proveedores: {
      findUnique: jest.fn(),
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
const mockTransaction = prisma.$transaction as jest.Mock;
const mockServiciosValidate = prisma.servicios.findMany as jest.Mock;
const mockMaterialesValidate = prisma.materiales.findMany as jest.Mock;

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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx = {
      proveedorPrecios: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
      gastos: { findMany: jest.fn().mockResolvedValue([]) },
    };
    mockTransaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));
    // Default: all requested IDs are valid
    mockServiciosValidate.mockImplementation((args: { where: { id_servicio: { in: number[] } } }) =>
      Promise.resolve(args.where.id_servicio.in.map((id: number) => ({ id_servicio: id })))
    );
    mockMaterialesValidate.mockImplementation(
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

  it("lanza ValidationError si un id_servicio no existe o está inactivo", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockServiciosValidate.mockResolvedValue([]); // none found

    await expect(syncProviderAssignments(1, "servicio", [{ id: 99, precio: 100 }])).rejects.toThrow(
      ValidationError
    );
  });

  it("lanza ValidationError si un id_material no existe", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockMaterialesValidate.mockResolvedValue([]); // none found

    await expect(syncProviderAssignments(1, "material", [{ id: 99, precio: 100 }])).rejects.toThrow(
      ValidationError
    );
  });
});

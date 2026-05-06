/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { getProviderAssignments, syncProviderAssignments } from "@/lib/services/proveedores";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    proveedorPrecios: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    proveedores: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

const mockFindMany = prisma.proveedorPrecios.findMany as jest.Mock;
const mockDeleteMany = prisma.proveedorPrecios.deleteMany as jest.Mock;
const mockCreate = prisma.proveedorPrecios.create as jest.Mock;
const mockUpdate = prisma.proveedorPrecios.update as jest.Mock;
const mockFindUniqueProveedor = prisma.proveedores.findUnique as jest.Mock;
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
    expect(result.prices).toEqual({ 1: 150, 10: 200, 2: 50 });
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
    expect(result.prices).toEqual({});
  });

  it("lanza NotFoundError si el proveedor no existe", async () => {
    mockFindUniqueProveedor.mockResolvedValue(null);
    await expect(getProviderAssignments(123)).rejects.toThrow("Proveedor 123 no encontrado");
  });
});

describe("syncProviderAssignments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("agrega nuevas asignaciones de servicios con precio", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([]);

    await syncProviderAssignments(1, "servicio", [{ id: 5, precio: 100 }]);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_proveedor: 1,
          id_servicio: 5,
          id_material: null,
          precio: 100,
        }),
      })
    );
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("elimina asignaciones que ya no están en la lista", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_material: 10, id_servicio: null, precio: 50, notas: "" },
    ]);

    await syncProviderAssignments(1, "material", [{ id: 20, precio: 75 }]);

    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_proveedor_precio: { in: [100] } },
      })
    );
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_material: 20,
          precio: 75,
        }),
      })
    );
  });

  it("actualiza el precio si la asignación ya existe", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 1, id_material: null, precio: 50, notas: "" },
    ]);

    await syncProviderAssignments(1, "servicio", [{ id: 1, precio: 200, notas: "actualizado" }]);

    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_proveedor_precio: { in: [] } } })
    );
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_proveedor_precio: 100 },
        data: expect.objectContaining({ precio: 200, notas: "actualizado" }),
      })
    );
  });

  it("lanza NotFoundError si el proveedor no existe al sincronizar", async () => {
    mockFindUniqueProveedor.mockResolvedValue(null);
    await expect(
      syncProviderAssignments(123, "servicio", [{ id: 1, precio: 100 }])
    ).rejects.toThrow("Proveedor 123 no encontrado");
  });

  it("elimina todas las asignaciones si el arreglo de IDs está vacío", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 1, id_material: null, precio: 50, notas: "" },
      { id_proveedor_precio: 101, id_servicio: 2, id_material: null, precio: 80, notas: "" },
    ]);

    await syncProviderAssignments(1, "servicio", []);

    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_proveedor_precio: { in: [100, 101] } } })
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("lanza un error si la transacción falla", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([]);
    mockTransaction.mockRejectedValue(new Error("Transaction failed"));

    await expect(
      syncProviderAssignments(1, "servicio", [{ id: 5, precio: 100 }])
    ).rejects.toThrow("Transaction failed");
  });
});

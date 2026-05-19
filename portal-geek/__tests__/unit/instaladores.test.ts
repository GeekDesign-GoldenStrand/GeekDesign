/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import {
  createInstalador,
  listInstaladores,
  getInstalador,
  updateInstalador,
  deleteInstalador,
  getInstaladorAssignments,
  syncInstaladorAssignments,
} from "@/lib/services/instaladores";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    instaladores: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    instaladorServicios: {
      findMany: jest.fn(),
    },
    servicios: {
      findMany: jest.fn(),
    },
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindMany = prisma.instaladores.findMany as jest.Mock;
const mockCount = prisma.instaladores.count as jest.Mock;
const mockFindUnique = prisma.instaladores.findUnique as jest.Mock;
const mockCreate = prisma.instaladores.create as jest.Mock;
const mockUpdate = prisma.instaladores.update as jest.Mock;
const mockServiciosFindMany = prisma.instaladorServicios.findMany as jest.Mock;
const mockServiciosValidate = prisma.servicios.findMany as jest.Mock;

const INSTALADOR = {
  id_instalador: 1,
  nombre_instalador: "Juan Pérez",
  apodo: null,
  tipo: "Instalador",
  telefono: "5551234567",
  correo: "juan@example.com",
  notas: null,
  ubicacion: null,
  estatus: "Activo",
};

const CREATE_INPUT = {
  nombre_instalador: "Juan Pérez",
  tipo: "Instalador" as const,
  telefono: "5551234567",
  correo: "juan@example.com",
  costo_instalacion: 350,
  estatus: "Activo" as const,
};

// ---------------------------------------------------------------------------
// createInstalador
// ---------------------------------------------------------------------------
describe("createInstalador", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna el instalador creado", async () => {
    mockCreate.mockResolvedValue(INSTALADOR);

    const result = await createInstalador(CREATE_INPUT);

    expect(result).toEqual(INSTALADOR);
  });

  it("llama a prisma.create con los datos recibidos", async () => {
    mockCreate.mockResolvedValue(INSTALADOR);

    await createInstalador(CREATE_INPUT);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        nombre_instalador: "Juan Pérez",
        apodo: null,
        tipo: "Instalador",
        telefono: "5551234567",
        correo: "juan@example.com",
        costo_instalacion: 350,
        notas: null,
        ubicacion: null,
        estatus: "Activo",
      },
    });
  });

  it("incluye campos opcionales cuando se proporcionan", async () => {
    const inputConOpcionales = { ...CREATE_INPUT, apodo: "Juanito", ubicacion: "CDMX" };
    mockCreate.mockResolvedValue({ ...INSTALADOR, apodo: "Juanito", ubicacion: "CDMX" });

    const result = await createInstalador(inputConOpcionales);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        nombre_instalador: "Juan Pérez",
        apodo: "Juanito",
        tipo: "Instalador",
        telefono: "5551234567",
        correo: "juan@example.com",
        costo_instalacion: 350,
        notas: null,
        ubicacion: "CDMX",
        estatus: "Activo",
      },
    });
    expect(result.apodo).toBe("Juanito");
    expect(result.ubicacion).toBe("CDMX");
  });
});

// ---------------------------------------------------------------------------
// listInstaladores
// ---------------------------------------------------------------------------
describe("listInstaladores", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // $transaction receives an array of promises — resolve them as-is so
    // findMany and count mocks are actually invoked and their args can be asserted.
    mockTransaction.mockImplementation((promises: Promise<unknown>[]) => Promise.all(promises));
  });

  it("retorna items y total correctamente", async () => {
    mockFindMany.mockResolvedValue([INSTALADOR]);
    mockCount.mockResolvedValue(1);

    const result = await listInstaladores(1, 20);

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("aplica paginación correctamente en página 2", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(25);

    const result = await listInstaladores(2, 10);

    expect(result.total).toBe(25);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
  });

  it("aplica paginación correctamente en página 1", async () => {
    mockFindMany.mockResolvedValue([INSTALADOR]);
    mockCount.mockResolvedValue(1);

    await listInstaladores(1, 20);

    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
  });

  it("retorna lista vacía cuando no hay instaladores", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const result = await listInstaladores(1, 20);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("excluye instaladores con estatus Inactivo (soft delete)", async () => {
    mockFindMany.mockResolvedValue([INSTALADOR]);
    mockCount.mockResolvedValue(1);

    await listInstaladores(1, 20);

    const expectedWhere = { estatus: { not: "Inactivo" } };
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
    expect(mockCount).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
  });
});

// ---------------------------------------------------------------------------
// getInstalador
// ---------------------------------------------------------------------------
describe("getInstalador", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna el instalador cuando existe", async () => {
    mockFindUnique.mockResolvedValue(INSTALADOR);

    const result = await getInstalador(1);

    expect(result).toEqual(INSTALADOR);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id_instalador: 1 } });
  });

  it("lanza NotFoundError cuando el instalador no existe", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(getInstalador(999)).rejects.toThrow(NotFoundError);
  });

  it("el mensaje de NotFoundError incluye el id", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(getInstalador(42)).rejects.toThrow("42");
  });
});

// ---------------------------------------------------------------------------
// updateInstalador — INST-02
// ---------------------------------------------------------------------------
describe("updateInstalador", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna el registro actualizado", async () => {
    const updated = { ...INSTALADOR, nombre_instalador: "Pedro López" };
    mockUpdate.mockResolvedValue(updated);

    const result = await updateInstalador(1, { nombre_instalador: "Pedro López" });

    expect(result.nombre_instalador).toBe("Pedro López");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_instalador: 1 } })
    );
  });

  it("actualiza solo los campos proporcionados", async () => {
    const updated = { ...INSTALADOR, correo: "nuevo@example.com" };
    mockUpdate.mockResolvedValue(updated);

    const result = await updateInstalador(1, { correo: "nuevo@example.com" });

    expect(result.correo).toBe("nuevo@example.com");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { correo: "nuevo@example.com" } })
    );
  });

  it("lanza NotFoundError cuando el instalador no existe (P2025)", async () => {
    mockUpdate.mockRejectedValue({ code: "P2025" });

    await expect(updateInstalador(999, { nombre_instalador: "No existe" })).rejects.toThrow(
      "Instalador 999 no encontrado"
    );
  });

  it("propaga errores distintos a P2025", async () => {
    mockUpdate.mockRejectedValue(new Error("Error de base de datos"));

    await expect(updateInstalador(1, { nombre_instalador: "Test" })).rejects.toThrow(
      "Error de base de datos"
    );
  });
});

// ---------------------------------------------------------------------------
// deleteInstalador — INST-03
// ---------------------------------------------------------------------------
describe("deleteInstalador", () => {
  beforeEach(() => jest.clearAllMocks());

  it("hace soft delete: llama update con estatus Inactivo", async () => {
    mockUpdate.mockResolvedValue({ ...INSTALADOR, estatus: "Inactivo" });

    await deleteInstalador(1);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id_instalador: 1 },
      data: { estatus: "Inactivo" },
    });
  });

  it("lanza NotFoundError cuando el instalador no existe (P2025)", async () => {
    mockUpdate.mockRejectedValue({ code: "P2025" });

    await expect(deleteInstalador(999)).rejects.toThrow("Instalador 999 no encontrado");
  });

  it("propaga errores distintos a P2025", async () => {
    mockUpdate.mockRejectedValue(new Error("Error de base de datos"));

    await expect(deleteInstalador(1)).rejects.toThrow("Error de base de datos");
  });
});

// ---------------------------------------------------------------------------
// getInstaladorAssignments
// ---------------------------------------------------------------------------
describe("getInstaladorAssignments", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna los serviceIds, servicePrices y serviceNotes de los servicios asignados", async () => {
    mockFindUnique.mockResolvedValue(INSTALADOR);
    mockServiciosFindMany.mockResolvedValue([
      { id_servicio: 10, costo: 150, notas: null },
      { id_servicio: 20, costo: 200, notas: "nota" },
    ]);

    const result = await getInstaladorAssignments(1);

    expect(result.serviceIds).toEqual([10, 20]);
    expect(result.servicePrices).toEqual({ 10: 150, 20: 200 });
    expect(result.serviceNotes).toEqual({ 20: "nota" });
    expect(mockServiciosFindMany).toHaveBeenCalledWith({
      where: { id_instalador: 1 },
      select: { id_servicio: true, costo: true, notas: true },
    });
  });

  it("lanza NotFoundError si el instalador no existe", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(getInstaladorAssignments(999)).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// syncInstaladorAssignments
// ---------------------------------------------------------------------------
describe("syncInstaladorAssignments", () => {
  let mockTx: {
    instaladorServicios: {
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
      instaladorServicios: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
      gastos: { findMany: jest.fn().mockResolvedValue([]) },
    };
    mockTransaction.mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));
    // Default: all requested service IDs are valid and active
    mockServiciosValidate.mockImplementation((args: { where: { id_servicio: { in: number[] } } }) =>
      Promise.resolve(args.where.id_servicio.in.map((id: number) => ({ id_servicio: id })))
    );
  });

  it("agrega servicios nuevos sin tocar los existentes", async () => {
    mockFindUnique.mockResolvedValue(INSTALADOR);
    mockTx.instaladorServicios.findMany.mockResolvedValue([
      { id_instalador_servicio: 10, id_servicio: 1 },
    ]);

    await syncInstaladorAssignments(1, [
      { id: 1, precio: 150 },
      { id: 2, precio: 250 },
    ]);

    expect(mockTx.instaladorServicios.deleteMany).not.toHaveBeenCalled();
    expect(mockTx.instaladorServicios.createMany).toHaveBeenCalledWith({
      data: [{ id_instalador: 1, id_servicio: 2, costo: 250, notas: null }],
      skipDuplicates: true,
    });
    expect(mockTx.instaladorServicios.update).toHaveBeenCalledWith({
      where: { id_instalador_servicio: 10 },
      data: { costo: 150, notas: null },
    });
  });

  it("usa createMany con todos los IDs nuevos en una sola llamada", async () => {
    mockFindUnique.mockResolvedValue(INSTALADOR);
    mockTx.instaladorServicios.findMany.mockResolvedValue([]);

    await syncInstaladorAssignments(1, [
      { id: 5, precio: 100 },
      { id: 6, precio: 200 },
    ]);

    expect(mockTx.instaladorServicios.createMany).toHaveBeenCalledWith({
      data: [
        { id_instalador: 1, id_servicio: 5, costo: 100, notas: null },
        { id_instalador: 1, id_servicio: 6, costo: 200, notas: null },
      ],
      skipDuplicates: true,
    });
    expect(mockTx.instaladorServicios.update).not.toHaveBeenCalled();
  });

  it("no llama deleteMany ni createMany cuando la lista es idéntica", async () => {
    mockFindUnique.mockResolvedValue(INSTALADOR);
    mockTx.instaladorServicios.findMany.mockResolvedValue([
      { id_instalador_servicio: 10, id_servicio: 5 },
    ]);

    await syncInstaladorAssignments(1, [{ id: 5, precio: 300 }]);

    expect(mockTx.instaladorServicios.deleteMany).not.toHaveBeenCalled();
    expect(mockTx.instaladorServicios.createMany).not.toHaveBeenCalled();
    expect(mockTx.instaladorServicios.update).toHaveBeenCalledWith({
      where: { id_instalador_servicio: 10 },
      data: { costo: 300, notas: null },
    });
  });

  it("no borra asignaciones referenciadas por Gastos", async () => {
    mockFindUnique.mockResolvedValue(INSTALADOR);
    mockTx.instaladorServicios.findMany.mockResolvedValue([
      { id_instalador_servicio: 10, id_servicio: 1 },
      { id_instalador_servicio: 11, id_servicio: 2 },
    ]);
    mockTx.gastos.findMany.mockResolvedValue([{ id_instalador_servicio: 11 }]);

    await syncInstaladorAssignments(1, [{ id: 1, precio: 150 }]); // wants to remove service 2 (pk 11)

    expect(mockTx.instaladorServicios.deleteMany).not.toHaveBeenCalled();
  });

  it("borra solo las asignaciones sin referencia en Gastos", async () => {
    mockFindUnique.mockResolvedValue(INSTALADOR);
    mockTx.instaladorServicios.findMany.mockResolvedValue([
      { id_instalador_servicio: 10, id_servicio: 1 },
      { id_instalador_servicio: 11, id_servicio: 2 },
    ]);
    mockTx.gastos.findMany.mockResolvedValue([{ id_instalador_servicio: 11 }]);

    await syncInstaladorAssignments(1, [{ id: 2, precio: 250 }]); // keep service 2 (pk 11 protected), remove service 1 (pk 10)

    expect(mockTx.instaladorServicios.deleteMany).toHaveBeenCalledWith({
      where: { id_instalador_servicio: { in: [10] } },
    });
  });

  it("lanza NotFoundError si el instalador no existe", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(syncInstaladorAssignments(999, [{ id: 1, precio: 100 }])).rejects.toThrow(
      NotFoundError
    );
  });

  it("lanza ValidationError si un id_servicio no existe", async () => {
    mockFindUnique.mockResolvedValue(INSTALADOR);
    mockServiciosValidate.mockResolvedValue([]); // none found

    await expect(syncInstaladorAssignments(1, [{ id: 99, precio: 100 }])).rejects.toThrow(
      ValidationError
    );
  });

  it("lanza ValidationError si un servicio está inactivo (estatus_servicio = false)", async () => {
    mockFindUnique.mockResolvedValue(INSTALADOR);
    mockServiciosValidate.mockResolvedValue([{ id_servicio: 1 }]); // only 1 of 2 returned

    await expect(
      syncInstaladorAssignments(1, [
        { id: 1, precio: 100 },
        { id: 2, precio: 200 },
      ])
    ).rejects.toThrow(ValidationError);
  });
});

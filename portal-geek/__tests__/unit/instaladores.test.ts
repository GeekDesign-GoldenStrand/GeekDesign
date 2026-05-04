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
} from "@/lib/services/instaladores";
import { NotFoundError } from "@/lib/utils/errors";

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
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindMany = prisma.instaladores.findMany as jest.Mock;
const mockCount = prisma.instaladores.count as jest.Mock;
const mockFindUnique = prisma.instaladores.findUnique as jest.Mock;
const mockCreate = prisma.instaladores.create as jest.Mock;
const mockUpdate = prisma.instaladores.update as jest.Mock;

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

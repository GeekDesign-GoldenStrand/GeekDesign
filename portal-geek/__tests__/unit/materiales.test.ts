/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { CreateMaterialSchema, CreateSubMaterialSchema } from "@/lib/schemas/materiales";
import {
  createGrupo,
  createMaterial,
  createSubMaterial,
  deleteMaterial,
  getMaterial,
  getMaterialesGrupos,
  getMaterialesOptions,
  listMateriales,
  updateMaterial,
} from "@/lib/services/materiales";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    materiales: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/services/storage", () => ({
  resolveImageUrl: jest.fn(async (key: string | null) =>
    key ? `https://signed.example/${key}` : null
  ),
  deleteObject: jest.fn(async () => undefined),
}));

const mockFindMany = prisma.materiales.findMany as jest.Mock;
const mockCount = prisma.materiales.count as jest.Mock;
const mockFindUnique = prisma.materiales.findUnique as jest.Mock;
const mockCreate = prisma.materiales.create as jest.Mock;
const mockUpdate = prisma.materiales.update as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

const KEY = "materiales/2026/05/00000000-0000-4000-8000-000000000001.jpg";
const SIGNED_URL = `https://signed.example/${KEY}`;

const BASE_MATERIAL = {
  id_material: 1,
  id_material_padre: null,
  es_grupo: false,
  nombre_material: "Acrílico espejo",
  descripcion_material: "Material de alta reflectividad",
  unidad_medida: "mm",
  ancho: 1200,
  alto: 2400,
  grosor: 3,
  velocidad_avance: 50,
  color: "#C0C0C0",
  imagen_url: KEY,
  subMateriales: [],
};

const VALID_INPUT = {
  nombre_material: "Acrílico espejo",
  descripcion_material: "Material de alta reflectividad",
  unidad_medida: "mm" as const,
  ancho: 1200,
  alto: 2400,
  grosor: 3,
  velocidad_avance: 50,
  color: "#C0C0C0",
  imagen_url: KEY,
};

// ──────────────────────────────────────────────────────────────────────────────
// getMaterialesOptions
// ──────────────────────────────────────────────────────────────────────────────
describe("getMaterialesOptions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("consulta solo materiales hoja (es_grupo: false, es_categoria: false)", async () => {
    mockFindMany.mockResolvedValue([BASE_MATERIAL]);

    const result = await getMaterialesOptions();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { es_grupo: false, es_categoria: false } })
    );
    expect(result).toHaveLength(1);
  });

  it("retorna lista vacía cuando no hay materiales individuales", async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await getMaterialesOptions();
    expect(result).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getMaterialesGrupos
// ──────────────────────────────────────────────────────────────────────────────
describe("getMaterialesGrupos", () => {
  beforeEach(() => jest.clearAllMocks());

  it("consulta solo grupos con sus sub-materiales incluidos", async () => {
    const GRUPO = { ...BASE_MATERIAL, es_grupo: true, unidad_medida: null, subMateriales: [] };
    mockFindMany.mockResolvedValue([GRUPO]);

    const result = await getMaterialesGrupos();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { es_grupo: true },
        include: { subMateriales: true },
      })
    );
    expect(result).toHaveLength(1);
  });

  it("resuelve las imágenes del grupo y sus sub-materiales", async () => {
    const SUB = { ...BASE_MATERIAL, id_material: 2, id_material_padre: 1 };
    const GRUPO = {
      ...BASE_MATERIAL,
      es_grupo: true,
      subMateriales: [SUB],
    };
    mockFindMany.mockResolvedValue([GRUPO]);

    const [result] = await getMaterialesGrupos();
    expect(result.imagen_url).toBe(SIGNED_URL);
    expect(result.subMateriales[0].imagen_url).toBe(SIGNED_URL);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// listMateriales
// ──────────────────────────────────────────────────────────────────────────────
describe("listMateriales", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it("retorna items y total correctamente", async () => {
    mockFindMany.mockResolvedValue([BASE_MATERIAL]);
    mockCount.mockResolvedValue(1);

    const result = await listMateriales(1, 20);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
  });

  it("aplica paginación correctamente en página 2", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(25);

    const result = await listMateriales(2, 10);
    expect(result.total).toBe(25);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
  });

  it("filtra solo ítems top-level (id_material_padre: null) sin búsqueda", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await listMateriales(1, 20);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_material_padre: null } })
    );
  });

  it("filtra por query de búsqueda en nombre y descripción", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await listMateriales(1, 20, "acrílico");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id_material_padre: null,
          OR: expect.arrayContaining([
            expect.objectContaining({
              nombre_material: { contains: "acrílico", mode: "insensitive" },
            }),
          ]),
        }),
      })
    );
  });

  it("ordena de forma descendente cuando sort es 'desc'", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await listMateriales(1, 20, undefined, "desc");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: expect.arrayContaining([{ nombre_material: "desc" }]),
      })
    );
  });

  it("incluye sub-materiales con dos niveles (categoría → grupo|individual → variante)", async () => {
    mockFindMany.mockResolvedValue([BASE_MATERIAL]);
    mockCount.mockResolvedValue(1);

    await listMateriales(1, 20);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          subMateriales: expect.objectContaining({
            include: { subMateriales: true },
          }),
        },
      })
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getMaterial
// ──────────────────────────────────────────────────────────────────────────────
describe("getMaterial", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna el material con imagen resuelta cuando existe", async () => {
    mockFindUnique.mockResolvedValue(BASE_MATERIAL);

    const result = await getMaterial(1);
    expect(result).toMatchObject({ ...BASE_MATERIAL, imagen_url: SIGNED_URL });
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id_material: 1 },
      include: { subMateriales: { include: { subMateriales: true } } },
    });
  });

  it("lanza NotFoundError cuando no existe", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(getMaterial(999)).rejects.toThrow(NotFoundError);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// createMaterial
// ──────────────────────────────────────────────────────────────────────────────
describe("createMaterial", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTransaction.mockImplementation(async (fn: (tx: any) => Promise<unknown>) => fn(prisma));
  });

  it("crea y retorna el nuevo material con imagen resuelta", async () => {
    mockCreate.mockResolvedValue(BASE_MATERIAL);

    const result = await createMaterial(VALID_INPUT);
    expect(result).toMatchObject({
      nombre_material: "Acrílico espejo",
      imagen_url: SIGNED_URL,
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: { ...VALID_INPUT, es_grupo: false, es_categoria: false },
      include: { subMateriales: { include: { subMateriales: true } } },
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// createGrupo
// ──────────────────────────────────────────────────────────────────────────────
describe("createGrupo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTransaction.mockImplementation(async (fn: (tx: any) => Promise<unknown>) => fn(prisma));
  });

  it("crea el grupo con es_grupo: true y unidad_medida: null", async () => {
    const GRUPO = { ...BASE_MATERIAL, es_grupo: true, unidad_medida: null, subMateriales: [] };
    mockCreate.mockResolvedValue(GRUPO);

    const result = await createGrupo({ tipo: "grupo", nombre_material: "Acrílicos de colores" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          es_grupo: true,
          es_categoria: false,
          unidad_medida: null,
        }),
        include: { subMateriales: { include: { subMateriales: true } } },
      })
    );
    expect(result).toMatchObject({ es_grupo: true, unidad_medida: null });
  });

  it("no incluye campos de dimensiones ni unidad_medida en los datos", async () => {
    const GRUPO = { ...BASE_MATERIAL, es_grupo: true, unidad_medida: null, subMateriales: [] };
    mockCreate.mockResolvedValue(GRUPO);

    await createGrupo({ tipo: "grupo", nombre_material: "Plásticos" });
    const call = mockCreate.mock.calls[0][0];
    expect(call.data).not.toHaveProperty("ancho");
    expect(call.data).not.toHaveProperty("alto");
    expect(call.data).not.toHaveProperty("grosor");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// createSubMaterial
// ──────────────────────────────────────────────────────────────────────────────
describe("createSubMaterial", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTransaction.mockImplementation(async (fn: (tx: any) => Promise<unknown>) => fn(prisma));
  });

  const SUB_INPUT = {
    tipo: "sub" as const,
    id_material_padre: 2,
    nombre_material: "Acrílico Verde",
    descripcion_material: "Color verde",
    unidad_medida: "mm" as const,
    ancho: 1200,
    alto: 2400,
    grosor: 3,
    velocidad_avance: 50,
    color: "#22C55E",
    imagen_url: KEY,
  };

  it("crea el sub-material cuando el padre es un grupo válido", async () => {
    mockFindUnique.mockResolvedValue({ es_grupo: true, es_categoria: false });
    const SUB = { ...BASE_MATERIAL, id_material: 3, id_material_padre: 2, subMateriales: [] };
    mockCreate.mockResolvedValue(SUB);

    const result = await createSubMaterial(SUB_INPUT);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          es_grupo: false,
          es_categoria: false,
          id_material_padre: 2,
        }),
        include: { subMateriales: { include: { subMateriales: true } } },
      })
    );
    expect(result).toMatchObject({ id_material_padre: 2 });
  });

  it("lanza ConflictError cuando el padre no es un grupo (es_grupo: false)", async () => {
    mockFindUnique.mockResolvedValue({ es_grupo: false, es_categoria: false });

    await expect(createSubMaterial(SUB_INPUT)).rejects.toThrow(ConflictError);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("lanza NotFoundError cuando el padre no existe", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(createSubMaterial(SUB_INPUT)).rejects.toThrow(NotFoundError);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// updateMaterial
// ──────────────────────────────────────────────────────────────────────────────
describe("updateMaterial", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTransaction.mockImplementation(async (fn: (tx: any) => Promise<unknown>) => fn(prisma));
  });

  it("actualiza y retorna el material modificado", async () => {
    mockFindUnique.mockResolvedValue({ imagen_url: KEY, es_grupo: false, es_categoria: false });
    const updated = { ...BASE_MATERIAL, nombre_material: "Acrílico opaco" };
    mockUpdate.mockResolvedValue(updated);

    const result = await updateMaterial(1, { nombre_material: "Acrílico opaco" });
    expect(result.nombre_material).toBe("Acrílico opaco");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id_material: 1 } }));
  });

  it("lanza NotFoundError cuando el material no existe (P2025)", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(updateMaterial(999, { nombre_material: "No existe" })).rejects.toThrow(
      NotFoundError
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// deleteMaterial — force delete (per stakeholder, ignores in-use relations)
// ──────────────────────────────────────────────────────────────────────────────
describe("deleteMaterial", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let txMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    txMock = {
      materiales: {
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      opcionesProducto: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      valoresOpcion: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      matrizDePrecios: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      servicioMaterial: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      proveedorPrecios: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      gastos: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      detallePedido: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      pedidoMaquina: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };

    mockTransaction.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn: (tx: any) => Promise<void>) => fn(txMock)
    );
  });

  it("elimina un material individual sin relaciones", async () => {
    txMock.materiales.findUnique.mockResolvedValue({
      id_material: 1,
      imagen_url: null,
      es_grupo: false,
      subMateriales: [],
    });

    await expect(deleteMaterial(1)).resolves.toBeUndefined();
    expect(txMock.materiales.delete).toHaveBeenCalledWith({ where: { id_material: 1 } });
  });

  it("forza el borrado de un grupo con sub-materiales (borra subs primero)", async () => {
    txMock.materiales.findUnique.mockResolvedValue({
      id_material: 1,
      imagen_url: null,
      es_grupo: true,
      subMateriales: [
        { id_material: 2, imagen_url: null },
        { id_material: 3, imagen_url: null },
      ],
    });

    await expect(deleteMaterial(1)).resolves.toBeUndefined();
    expect(txMock.materiales.deleteMany).toHaveBeenCalledWith({
      where: { id_material: { in: [2, 3] } },
    });
    expect(txMock.materiales.delete).toHaveBeenCalledWith({ where: { id_material: 1 } });
  });

  it("cascada por OpcionesProducto → ValoresOpcion + MatrizDePrecios", async () => {
    txMock.materiales.findUnique.mockResolvedValue({
      id_material: 1,
      imagen_url: null,
      es_grupo: false,
      subMateriales: [],
    });
    txMock.opcionesProducto.findMany.mockResolvedValue([{ id_opcion: 10 }, { id_opcion: 11 }]);

    await deleteMaterial(1);

    expect(txMock.matrizDePrecios.deleteMany).toHaveBeenCalledWith({
      where: { id_opcion: { in: [10, 11] } },
    });
    expect(txMock.valoresOpcion.deleteMany).toHaveBeenCalledWith({
      where: { id_opcion: { in: [10, 11] } },
    });
    expect(txMock.opcionesProducto.deleteMany).toHaveBeenCalledWith({
      where: { id_opcion: { in: [10, 11] } },
    });
  });

  it("limpia Gastos.id_proveedor_precio antes de borrar ProveedorPrecios", async () => {
    txMock.materiales.findUnique.mockResolvedValue({
      id_material: 1,
      imagen_url: null,
      es_grupo: false,
      subMateriales: [],
    });
    txMock.proveedorPrecios.findMany.mockResolvedValue([{ id_proveedor_precio: 99 }]);

    await deleteMaterial(1);

    expect(txMock.gastos.updateMany).toHaveBeenCalledWith({
      where: { id_proveedor_precio: { in: [99] } },
      data: { id_proveedor_precio: null },
    });
    expect(txMock.proveedorPrecios.deleteMany).toHaveBeenCalledWith({
      where: { id_proveedor_precio: { in: [99] } },
    });
  });

  it("lanza NotFoundError cuando el material no existe", async () => {
    txMock.materiales.findUnique.mockResolvedValue(null);
    await expect(deleteMaterial(999)).rejects.toThrow(NotFoundError);
    expect(txMock.materiales.delete).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Schema — color validation (CreateMaterialSchema & CreateSubMaterialSchema)
// ──────────────────────────────────────────────────────────────────────────────
const SCHEMA_MATERIAL_BASE = {
  nombre_material: "Acrílico espejo",
  descripcion_material: "Material de alta reflectividad",
  unidad_medida: "mm" as const,
  ancho: 1200,
  alto: 2400,
  grosor: 3,
  velocidad_avance: 50,
  imagen_url: KEY,
};

const SCHEMA_SUB_BASE = {
  tipo: "sub" as const,
  id_material_padre: 2,
  nombre_material: "Acrílico Verde",
  descripcion_material: "Color verde",
  unidad_medida: "mm" as const,
  ancho: 1200,
  alto: 2400,
  grosor: 3,
  velocidad_avance: 50,
  imagen_url: KEY,
};

describe("CreateMaterialSchema — color", () => {
  it.each(["Rojo", "Verde menta", "Plata", "Negro mate", "#3B82F6"])(
    "accepts a descriptive color: %s",
    (color) => {
      expect(CreateMaterialSchema.safeParse({ ...SCHEMA_MATERIAL_BASE, color }).success).toBe(true);
    }
  );

  it.each([
    ["empty string", ""],
    ["only whitespace", "   "],
    ["forbidden chars", "Rojo<script>"],
  ])("rejects an invalid color (%s): %s", (_label, color) => {
    expect(CreateMaterialSchema.safeParse({ ...SCHEMA_MATERIAL_BASE, color }).success).toBe(false);
  });
});

describe("CreateSubMaterialSchema — color", () => {
  it.each(["Verde", "Verde menta", "#22C55E"])("accepts a descriptive color: %s", (color) => {
    expect(CreateSubMaterialSchema.safeParse({ ...SCHEMA_SUB_BASE, color }).success).toBe(true);
  });

  it.each([
    ["empty string", ""],
    ["forbidden chars", "Verde{}"],
  ])("rejects an invalid color (%s): %s", (_label, color) => {
    expect(CreateSubMaterialSchema.safeParse({ ...SCHEMA_SUB_BASE, color }).success).toBe(false);
  });
});

describe("CreateMaterialSchema — descripcion opcional", () => {
  it("acepta payload sin descripcion_material", () => {
    const { descripcion_material: _omit, ...rest } = {
      ...SCHEMA_MATERIAL_BASE,
      color: "Plata",
    };
    void _omit;
    expect(CreateMaterialSchema.safeParse(rest).success).toBe(true);
  });
});

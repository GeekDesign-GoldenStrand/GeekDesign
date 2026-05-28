import type { Materiales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type {
  CreateCategoriaMaterialInput,
  CreateGrupoMaterialInput,
  CreateMaterialInput,
  CreateSubMaterialInput,
  UpdateMaterialInput,
} from "@/lib/schemas/materiales";
import { deleteObject, resolveImageUrl } from "@/lib/services/storage";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";

export type MaterialesConSubs = Materiales & {
  subMateriales: MaterialesConSubs[];
};

export interface MaterialProveedor {
  id: number;
  nombre: string;
  tipo: string;
  estatus: string;
  telefono: string;
  correo: string;
  precio: string;
}

async function withResolvedImagen(material: Materiales): Promise<Materiales> {
  return { ...material, imagen_url: await resolveImageUrl(material.imagen_url) };
}

async function safeDelete(key: string | null): Promise<void> {
  if (!key) return;
  try {
    await deleteObject(key);
  } catch (err) {
    console.error("storage delete failed", { key, err });
  }
}

// Recursive resolve: any depth (categoría → grupo → variante).
async function resolveConSubs(
  item: Materiales & { subMateriales?: unknown }
): Promise<MaterialesConSubs> {
  const resolved = await withResolvedImagen(item);
  const raw = (item as MaterialesConSubs).subMateriales ?? [];
  const resolvedSubs = await Promise.all(raw.map(resolveConSubs));
  return { ...resolved, subMateriales: resolvedSubs };
}

// Leaf-only materials (es_grupo=false, es_categoria=false). For pickers.
export async function getMaterialesOptions(): Promise<Materiales[]> {
  return prisma.materiales.findMany({
    where: { es_grupo: false, es_categoria: false },
    orderBy: { nombre_material: "asc" },
  });
}

// Groups with their variantes. For service forms that pick groups.
export async function getMaterialesGrupos(): Promise<MaterialesConSubs[]> {
  const grupos = await prisma.materiales.findMany({
    where: { es_grupo: true },
    include: { subMateriales: true },
    orderBy: { nombre_material: "asc" },
  });
  return Promise.all(grupos.map((g) => resolveConSubs(g)));
}

// Top-level categorías. For category pickers in create modals.
export async function getCategorias(): Promise<Materiales[]> {
  return prisma.materiales.findMany({
    where: { es_categoria: true },
    orderBy: { nombre_material: "asc" },
  });
}

export async function listMateriales(
  page: number,
  pageSize: number,
  q?: string,
  sort: "asc" | "desc" = "asc",
  tipo?: "categorias" | "grupos" | "individuales"
): Promise<{ items: MaterialesConSubs[]; total: number }> {
  const searchFilter = q
    ? {
        OR: [
          { nombre_material: { contains: q, mode: "insensitive" as const } },
          { descripcion_material: { contains: q, mode: "insensitive" as const } },
          { unidad_medida: { contains: q, mode: "insensitive" as const } },
          { color: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const tipoFilter =
    tipo === "categorias"
      ? { es_categoria: true }
      : tipo === "grupos"
        ? { es_grupo: true, es_categoria: false }
        : tipo === "individuales"
          ? { es_grupo: false, es_categoria: false }
          : undefined;

  // Roots = either categorías (padre=null) or grupos/individuales sin categoría asignada.
  const where = { id_material_padre: null, ...tipoFilter, ...searchFilter };

  // Eager-load 2 levels: categoría → (grupo|individual) → variante.
  const [items, total] = await prisma.$transaction([
    prisma.materiales.findMany({
      where,
      include: {
        subMateriales: {
          include: { subMateriales: true },
          orderBy: { nombre_material: sort },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ es_categoria: "desc" }, { es_grupo: "desc" }, { nombre_material: sort }],
    }),
    prisma.materiales.count({ where }),
  ]);

  const resolved = await Promise.all(items.map((i) => resolveConSubs(i)));
  return { items: resolved, total };
}

export async function getMaterial(id: number): Promise<MaterialesConSubs> {
  const material = await prisma.materiales.findUnique({
    where: { id_material: id },
    include: { subMateriales: { include: { subMateriales: true } } },
  });

  if (!material) {
    throw new NotFoundError(`Material ${id} no encontrado`);
  }

  return resolveConSubs(material);
}

export async function getMaterialProveedores(id: number): Promise<MaterialProveedor[]> {
  const rows = await prisma.proveedorPrecios.findMany({
    where: { id_material: id },
    include: {
      proveedor: {
        select: {
          id_proveedor: true,
          nombre_proveedor: true,
          tipo: true,
          estatus: true,
          telefono: true,
          correo: true,
        },
      },
    },
  });

  return rows.map((pp) => ({
    id: pp.proveedor.id_proveedor,
    nombre: pp.proveedor.nombre_proveedor,
    tipo: pp.proveedor.tipo,
    estatus: pp.proveedor.estatus,
    telefono: pp.proveedor.telefono,
    correo: pp.proveedor.correo,
    precio: pp.precio.toString(),
  }));
}

// Validates that `padreId` is a legal parent for a row whose target role is:
// - "categoria": padre must be null (categorías are top-level only).
// - "grupo": padre null o categoría.
// - "variante": padre debe ser grupo.
// - "individual": padre null o categoría.
async function assertPadreValido(
  padreId: number | null | undefined,
  role: "categoria" | "grupo" | "variante" | "individual",
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0] = prisma as never
): Promise<void> {
  if (padreId == null) {
    if (role === "variante") {
      throw new ConflictError("Una variante debe pertenecer a un grupo");
    }
    return;
  }

  const padre = await tx.materiales.findUnique({
    where: { id_material: padreId },
    select: { es_grupo: true, es_categoria: true },
  });

  if (!padre) {
    throw new NotFoundError(`Material padre ${padreId} no encontrado`);
  }

  if (role === "categoria") {
    throw new ConflictError("Una categoría no puede tener padre");
  }

  if (role === "grupo" || role === "individual") {
    if (!padre.es_categoria) {
      throw new ConflictError("El padre de un grupo o material individual debe ser una categoría");
    }
    return;
  }

  // role === "variante"
  if (!padre.es_grupo) {
    throw new ConflictError("El padre de una variante debe ser un grupo");
  }
}

export async function createCategoria(
  data: CreateCategoriaMaterialInput
): Promise<MaterialesConSubs> {
  const { tipo: _tipo, ...rest } = data;
  const created = await prisma.materiales.create({
    data: {
      nombre_material: rest.nombre_material,
      descripcion_material: rest.descripcion_material ?? null,
      imagen_url: rest.imagen_url ?? null,
      es_categoria: true,
      es_grupo: false,
      unidad_medida: null,
    },
    include: { subMateriales: { include: { subMateriales: true } } },
  });
  return resolveConSubs(created);
}

export async function createMaterial(data: CreateMaterialInput): Promise<MaterialesConSubs> {
  const created = await prisma.$transaction(async (tx) => {
    await assertPadreValido(data.id_material_padre ?? null, "individual", tx);
    return tx.materiales.create({
      data: { ...data, es_grupo: false, es_categoria: false },
      include: { subMateriales: { include: { subMateriales: true } } },
    });
  });
  return resolveConSubs(created);
}

export async function createGrupo(data: CreateGrupoMaterialInput): Promise<MaterialesConSubs> {
  const { tipo: _tipo, ...rest } = data;
  const created = await prisma.$transaction(async (tx) => {
    await assertPadreValido(rest.id_material_padre ?? null, "grupo", tx);
    return tx.materiales.create({
      data: {
        nombre_material: rest.nombre_material,
        descripcion_material: rest.descripcion_material ?? null,
        imagen_url: rest.imagen_url ?? null,
        id_material_padre: rest.id_material_padre ?? null,
        es_grupo: true,
        es_categoria: false,
        unidad_medida: null,
      },
      include: { subMateriales: { include: { subMateriales: true } } },
    });
  });
  return resolveConSubs(created);
}

export async function createSubMaterial(data: CreateSubMaterialInput): Promise<MaterialesConSubs> {
  const { tipo: _tipo, ...rest } = data;
  const created = await prisma.$transaction(async (tx) => {
    await assertPadreValido(rest.id_material_padre, "variante", tx);
    return tx.materiales.create({
      data: { ...rest, es_grupo: false, es_categoria: false },
      include: { subMateriales: { include: { subMateriales: true } } },
    });
  });
  return resolveConSubs(created);
}

export async function updateMaterial(
  id: number,
  data: UpdateMaterialInput
): Promise<MaterialesConSubs> {
  try {
    const { updated, oldImagenKey } = await prisma.$transaction(async (tx) => {
      const existing = await tx.materiales.findUnique({
        where: { id_material: id },
        select: { imagen_url: true, es_grupo: true, es_categoria: true },
      });

      if (!existing) {
        throw new NotFoundError(`Material ${id} no encontrado`);
      }

      if (data.id_material_padre !== undefined) {
        if (data.id_material_padre === id) {
          throw new ConflictError("Un material no puede ser su propio padre");
        }

        const role: "categoria" | "grupo" | "variante" | "individual" = existing.es_categoria
          ? "categoria"
          : existing.es_grupo
            ? "grupo"
            : data.id_material_padre != null
              ? // For leaf rows, the role depends on the parent's kind; assertPadreValido
                // validates both "variante" and "individual" parent rules. We pick the
                // role from the parent below.
                "individual"
              : "individual";

        // For leaves, infer whether the new parent is a grupo (→ variante) or
        // categoría (→ individual) so we use the right rule.
        if (!existing.es_grupo && !existing.es_categoria && data.id_material_padre != null) {
          const padre = await tx.materiales.findUnique({
            where: { id_material: data.id_material_padre },
            select: { es_grupo: true, es_categoria: true },
          });
          if (!padre) {
            throw new NotFoundError(`Material padre ${data.id_material_padre} no encontrado`);
          }
          if (padre.es_grupo) {
            await assertPadreValido(data.id_material_padre, "variante", tx);
          } else if (padre.es_categoria) {
            await assertPadreValido(data.id_material_padre, "individual", tx);
          } else {
            throw new ConflictError("El padre de un material debe ser un grupo o una categoría");
          }
        } else {
          await assertPadreValido(data.id_material_padre, role, tx);
        }
      }

      const result = await tx.materiales.update({
        where: { id_material: id },
        data,
        include: { subMateriales: { include: { subMateriales: true } } },
      });

      const oldImagenKey =
        existing.imagen_url && existing.imagen_url !== result.imagen_url
          ? existing.imagen_url
          : null;

      return { updated: result, oldImagenKey };
    });

    await safeDelete(oldImagenKey);
    return resolveConSubs(updated);
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Material ${id} no encontrado`);
    }
    throw err;
  }
}

export async function deleteMaterial(id: number): Promise<void> {
  let imagenKey: string | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      const material = await tx.materiales.findUnique({
        where: { id_material: id },
        select: {
          id_material: true,
          imagen_url: true,
          es_grupo: true,
          es_categoria: true,
          subMateriales: { select: { id_material: true } },
          opciones: { select: { id_opcion: true } },
          detallesPedido: { select: { id_detalle: true } },
          pedidoMaquinas: { select: { id_pedido_maquina: true } },
        },
      });

      if (!material) {
        throw new NotFoundError(`Material ${id} no encontrado`);
      }

      if (material.es_categoria && material.subMateriales.length > 0) {
        throw new ConflictError(
          `No se puede eliminar la categoría porque contiene ${material.subMateriales.length} elemento(s)`
        );
      }

      if (material.es_grupo && material.subMateriales.length > 0) {
        throw new ConflictError(
          `No se puede eliminar el grupo porque tiene ${material.subMateriales.length} variante(s) activa(s)`
        );
      }

      if (
        material.detallesPedido.length > 0 ||
        material.pedidoMaquinas.length > 0 ||
        material.opciones.length > 0
      ) {
        throw new ConflictError(`Material ${id} no se puede eliminar porque ya está en uso`);
      }

      imagenKey = material.imagen_url;

      await tx.materiales.delete({ where: { id_material: id } });
    });

    await safeDelete(imagenKey);
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Material ${id} no encontrado`);
    }
    throw err;
  }
}

import type { Materiales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type {
  CreateGrupoMaterialInput,
  CreateMaterialInput,
  CreateSubMaterialInput,
  UpdateMaterialInput,
} from "@/lib/schemas/materiales";
import { deleteObject, resolveImageUrl } from "@/lib/services/storage";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";

export type MaterialesConSubs = Materiales & {
  subMateriales: Materiales[];
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

async function resolveConSubs(item: MaterialesConSubs): Promise<MaterialesConSubs> {
  const resolved = await withResolvedImagen(item);
  const resolvedSubs = await Promise.all(item.subMateriales.map(withResolvedImagen));
  return { ...resolved, subMateriales: resolvedSubs };
}

// Returns only leaf materials (individual + sub), excluding groups.
// Used for formula builders and other contexts that need selectable materials.
export async function getMaterialesOptions(): Promise<Materiales[]> {
  return prisma.materiales.findMany({
    where: { es_grupo: false },
    orderBy: { nombre_material: "asc" },
  });
}

// Returns groups with their sub-materials for the group picker in service forms.
export async function getMaterialesGrupos(): Promise<MaterialesConSubs[]> {
  const grupos = await prisma.materiales.findMany({
    where: { es_grupo: true },
    include: { subMateriales: true },
    orderBy: { nombre_material: "asc" },
  });
  return Promise.all(grupos.map(resolveConSubs));
}

export async function listMateriales(
  page: number,
  pageSize: number,
  q?: string,
  sort: "asc" | "desc" = "asc"
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

  // Only top-level materials (groups + individuals). Sub-materials are nested.
  const where = { id_material_padre: null, ...searchFilter };

  const [items, total] = await prisma.$transaction([
    prisma.materiales.findMany({
      where,
      include: { subMateriales: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre_material: sort },
    }),
    prisma.materiales.count({ where }),
  ]);

  const resolved = await Promise.all(items.map(resolveConSubs));
  return { items: resolved, total };
}

export async function getMaterial(id: number): Promise<MaterialesConSubs> {
  const material = await prisma.materiales.findUnique({
    where: { id_material: id },
    include: { subMateriales: true },
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

export async function createMaterial(data: CreateMaterialInput): Promise<MaterialesConSubs> {
  const created = await prisma.materiales.create({
    data: { ...data, es_grupo: false },
    include: { subMateriales: true },
  });
  return resolveConSubs(created);
}

export async function createGrupo(data: CreateGrupoMaterialInput): Promise<MaterialesConSubs> {
  const { tipo: _tipo, ...rest } = data;
  const created = await prisma.materiales.create({
    data: {
      nombre_material: rest.nombre_material,
      descripcion_material: rest.descripcion_material ?? null,
      imagen_url: rest.imagen_url ?? null,
      es_grupo: true,
      unidad_medida: null,
    },
    include: { subMateriales: true },
  });
  return resolveConSubs(created);
}

export async function createSubMaterial(data: CreateSubMaterialInput): Promise<MaterialesConSubs> {
  const { tipo: _tipo, ...rest } = data;

  const padre = await prisma.materiales.findUnique({
    where: { id_material: rest.id_material_padre },
    select: { es_grupo: true },
  });
  if (!padre?.es_grupo) {
    throw new ConflictError("El material padre no es un grupo válido");
  }

  const created = await prisma.materiales.create({
    data: { ...rest, es_grupo: false },
    include: { subMateriales: true },
  });
  return resolveConSubs(created);
}

export async function updateMaterial(
  id: number,
  data: UpdateMaterialInput
): Promise<MaterialesConSubs> {
  try {
    const existing =
      data.imagen_url !== undefined
        ? await prisma.materiales.findUnique({
            where: { id_material: id },
            select: { imagen_url: true },
          })
        : null;

    const updated = await prisma.materiales.update({
      where: { id_material: id },
      data,
      include: { subMateriales: true },
    });

    if (existing && existing.imagen_url && existing.imagen_url !== updated.imagen_url) {
      await safeDelete(existing.imagen_url);
    }

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
          subMateriales: { select: { id_material: true } },
          opciones: { select: { id_opcion: true } },
          detallesPedido: { select: { id_detalle: true } },
          pedidoMaquinas: { select: { id_pedido_maquina: true } },
        },
      });

      if (!material) {
        throw new NotFoundError(`Material ${id} no encontrado`);
      }

      if (material.es_grupo && material.subMateriales.length > 0) {
        throw new ConflictError(
          `No se puede eliminar el grupo porque tiene ${material.subMateriales.length} sub-material(es) activo(s)`
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

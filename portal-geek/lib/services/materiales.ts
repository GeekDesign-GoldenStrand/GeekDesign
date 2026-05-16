import type { Materiales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaterialInput, UpdateMaterialInput } from "@/lib/schemas/materiales";
import { deleteObject, resolveImageUrl } from "@/lib/services/storage";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";

export interface MaterialProveedor {
  id: number;
  nombre: string;
  tipo: string;
  estatus: string;
  telefono: string;
  correo: string;
  precio: string;
// On read, the `imagen_url` column holds the storage key. Replace it with a
// fetchable URL (public or short-lived presigned GET) before returning.
async function withResolvedImagen(material: Materiales): Promise<Materiales> {
  return { ...material, imagen_url: await resolveImageUrl(material.imagen_url) };
}

// Best-effort storage cleanup. We never let a failed object delete block the
// DB transaction or response — orphaned objects are cheaper than 500s.
async function safeDelete(key: string | null): Promise<void> {
  if (!key) return;
  try {
    await deleteObject(key);
  } catch (err) {
    console.error("storage delete failed", { key, err });
  }
}

export async function listMateriales(
  page: number,
  pageSize: number,
  q?: string,
  sort: "asc" | "desc" = "asc"
): Promise<{ items: Materiales[]; total: number }> {
  const where = q
    ? {
        OR: [
          { nombre_material: { contains: q, mode: "insensitive" as const } },
          { descripcion_material: { contains: q, mode: "insensitive" as const } },
          { unidad_medida: { contains: q, mode: "insensitive" as const } },
          { color: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [items, total] = await prisma.$transaction([
    prisma.materiales.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre_material: sort },
    }),
    prisma.materiales.count({ where }),
  ]);

  const resolved = await Promise.all(items.map(withResolvedImagen));
  return { items: resolved, total };
}

export async function getMaterial(id: number): Promise<Materiales> {
  // Fetch material by primary key.
  const material = await prisma.materiales.findUnique({ where: { id_material: id } });

  if (!material) {
    throw new NotFoundError(`Material ${id} no encontrado`);
  }

  return withResolvedImagen(material);
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

export async function createMaterial(data: CreateMaterialInput): Promise<Materiales> {
  // Persist a new material row using validated payload from the API schema.
  const created = await prisma.materiales.create({ data });
  return withResolvedImagen(created);
}

export async function updateMaterial(id: number, data: UpdateMaterialInput): Promise<Materiales> {
  try {
    // Capture the previous image key so we can clean it up if it changes.
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
    });

    if (existing && existing.imagen_url && existing.imagen_url !== updated.imagen_url) {
      await safeDelete(existing.imagen_url);
    }

    return withResolvedImagen(updated);
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
          opciones: { select: { id_opcion: true } },
          detallesPedido: { select: { id_detalle: true } },
          pedidoMaquinas: { select: { id_pedido_maquina: true } },
        },
      });

      if (!material) {
        throw new NotFoundError(`Material ${id} no encontrado`);
      }

      if (
        material.detallesPedido.length > 0 ||
        material.pedidoMaquinas.length > 0 ||
        material.opciones.length > 0
      ) {
        throw new ConflictError(`Material ${id} no se puede eliminar porque ya está en uso`);
      }

      imagenKey = material.imagen_url;

      await tx.materiales.delete({
        where: { id_material: id },
      });
    });

    await safeDelete(imagenKey);
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Material ${id} no encontrado`);
    }
    throw err;
  }
}

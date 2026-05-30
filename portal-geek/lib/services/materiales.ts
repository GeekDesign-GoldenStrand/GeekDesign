import type { Materiales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type {
  CreateGrupoMaterialInput,
  CreateMaterialInput,
  CreateSubMaterialInput,
  UpdateMaterialInput,
} from "@/lib/schemas/materiales";
import { assertObjectIsImage, deleteObject, resolveImageUrl } from "@/lib/services/storage";
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

export interface MaterialImpacto {
  servicios: number;
  proveedores: number;
  instaladores: number;
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
  sort: "asc" | "desc" = "asc",
  tipo?: "grupos" | "individuales"
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
    tipo === "grupos"
      ? { es_grupo: true }
      : tipo === "individuales"
        ? { es_grupo: false }
        : undefined;

  // Only top-level materials (groups + individuals). Sub-materials are nested.
  const where = { id_material_padre: null, ...tipoFilter, ...searchFilter };

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
  // T6: verify the upload bytes match the declared image type before committing
  // the key to the DB. Throws ValidationError + cleans up the bogus object.
  await assertObjectIsImage(data.imagen_url);
  const created = await prisma.materiales.create({
    data: { ...data, es_grupo: false },
    include: { subMateriales: true },
  });
  return resolveConSubs(created);
}

export async function createGrupo(data: CreateGrupoMaterialInput): Promise<MaterialesConSubs> {
  const { tipo: _tipo, ...rest } = data;
  await assertObjectIsImage(rest.imagen_url);
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
  await assertObjectIsImage(rest.imagen_url);

  const created = await prisma.$transaction(async (tx) => {
    const padre = await tx.materiales.findUnique({
      where: { id_material: rest.id_material_padre },
      select: { es_grupo: true },
    });
    if (!padre?.es_grupo) {
      throw new ConflictError("El material padre no es un grupo válido");
    }

    return tx.materiales.create({
      data: { ...rest, es_grupo: false },
      include: { subMateriales: true },
    });
  });
  return resolveConSubs(created);
}

export async function updateMaterial(
  id: number,
  input: UpdateMaterialInput
): Promise<MaterialesConSubs> {
  // A cleared image arrives as "" from the form; persist it as NULL so the
  // column stays empty rather than holding an invalid empty-string key.
  const data = {
    ...input,
    ...(input.imagen_url === "" ? { imagen_url: null } : {}),
  };
  // T6: verify a newly-supplied image key matches a real raster image before
  // we commit it. Skipped when the field is being cleared (null) or absent.
  if (data.imagen_url) {
    await assertObjectIsImage(data.imagen_url);
  }
  try {
    const { updated, oldImagenKey } = await prisma.$transaction(async (tx) => {
      const needsExisting = data.imagen_url !== undefined || data.id_material_padre !== undefined;
      const existing = needsExisting
        ? await tx.materiales.findUnique({
            where: { id_material: id },
            select: { imagen_url: true, es_grupo: true },
          })
        : null;

      if (needsExisting && !existing) {
        throw new NotFoundError(`Material ${id} no encontrado`);
      }

      if (data.id_material_padre !== undefined && data.id_material_padre !== null) {
        if (data.id_material_padre === id) {
          throw new ConflictError("Un material no puede ser su propio padre");
        }

        if (existing!.es_grupo) {
          throw new ConflictError("Un grupo no puede tener material padre");
        }

        const padre = await tx.materiales.findUnique({
          where: { id_material: data.id_material_padre },
          select: { es_grupo: true },
        });

        if (!padre) {
          throw new NotFoundError(`Material padre ${data.id_material_padre} no encontrado`);
        }

        if (!padre.es_grupo) {
          throw new ConflictError("El material padre debe ser un grupo");
        }
      }

      const result = await tx.materiales.update({
        where: { id_material: id },
        data,
        include: { subMateriales: true },
      });

      const oldImagenKey =
        existing?.imagen_url && existing.imagen_url !== result.imagen_url
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

// Compute how many distinct servicios, proveedores e instaladores would be
// affected by deleting `id` (and, for groups, all its sub-materials).
//
// Servicios: distinct servicios referencing any of the material ids through
// either ServicioMaterial or OpcionesProducto.
// Proveedores: union of (a) ProveedorPrecios with id_material in scope and
// (b) the proveedor assigned to any servicio in the impacted services set.
// Instaladores: union of servicio.id_instalador and InstaladorServicios for
// any servicio in the impacted set.
export async function getMaterialImpacto(id: number): Promise<MaterialImpacto> {
  const target = await prisma.materiales.findUnique({
    where: { id_material: id },
    select: {
      id_material: true,
      es_grupo: true,
      subMateriales: { select: { id_material: true } },
    },
  });

  if (!target) {
    throw new NotFoundError(`Material ${id} no encontrado`);
  }

  const ids = target.es_grupo
    ? [target.id_material, ...target.subMateriales.map((s) => s.id_material)]
    : [target.id_material];

  const [servicioMateriales, opciones, proveedorPreciosDirectos] = await Promise.all([
    prisma.servicioMaterial.findMany({
      where: { id_material: { in: ids } },
      select: { id_servicio: true },
    }),
    prisma.opcionesProducto.findMany({
      where: { id_material: { in: ids } },
      select: { id_servicio: true },
    }),
    prisma.proveedorPrecios.findMany({
      where: { id_material: { in: ids } },
      select: { id_proveedor: true },
    }),
  ]);

  const servicioIds = new Set<number>([
    ...servicioMateriales.map((sm) => sm.id_servicio),
    ...opciones.map((o) => o.id_servicio),
  ]);

  const proveedorIds = new Set<number>(proveedorPreciosDirectos.map((p) => p.id_proveedor));
  const instaladorIds = new Set<number>();

  if (servicioIds.size > 0) {
    const servicioIdList = [...servicioIds];
    const [serviciosRefs, instaladorServicios] = await Promise.all([
      prisma.servicios.findMany({
        where: { id_servicio: { in: servicioIdList } },
        select: { id_proveedor: true, id_instalador: true },
      }),
      prisma.instaladorServicios.findMany({
        where: { id_servicio: { in: servicioIdList } },
        select: { id_instalador: true },
      }),
    ]);

    for (const s of serviciosRefs) {
      if (s.id_proveedor) proveedorIds.add(s.id_proveedor);
      if (s.id_instalador) instaladorIds.add(s.id_instalador);
    }
    for (const ins of instaladorServicios) instaladorIds.add(ins.id_instalador);
  }

  return {
    servicios: servicioIds.size,
    proveedores: proveedorIds.size,
    instaladores: instaladorIds.size,
  };
}

// Force-deletes a material (and, for groups, its sub-materials) even if it is
// in use. Per stakeholder request — bypasses the previous ConflictError guard
// and cascades through OpcionesProducto/ValoresOpcion/MatrizDePrecios,
// ServicioMaterial, ProveedorPrecios (nulling Gastos refs), DetallePedido and
// PedidoMaquina. UI must show three confirmation steps before invoking this.
export async function deleteMaterial(id: number): Promise<void> {
  const imagenKeys: string[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.materiales.findUnique({
        where: { id_material: id },
        select: {
          id_material: true,
          imagen_url: true,
          es_grupo: true,
          subMateriales: { select: { id_material: true, imagen_url: true } },
        },
      });

      if (!target) {
        throw new NotFoundError(`Material ${id} no encontrado`);
      }

      // For groups, delete sub-materials first so the self-FK doesn't block.
      const subIds = target.subMateriales.map((s) => s.id_material);
      const allIds = [...subIds, target.id_material];

      for (const sub of target.subMateriales) {
        if (sub.imagen_url) imagenKeys.push(sub.imagen_url);
      }
      if (target.imagen_url) imagenKeys.push(target.imagen_url);

      // OpcionesProducto → cascade ValoresOpcion + MatrizDePrecios first.
      const opciones = await tx.opcionesProducto.findMany({
        where: { id_material: { in: allIds } },
        select: { id_opcion: true },
      });
      const opcionIds = opciones.map((o) => o.id_opcion);
      if (opcionIds.length > 0) {
        await tx.matrizDePrecios.deleteMany({ where: { id_opcion: { in: opcionIds } } });
        await tx.valoresOpcion.deleteMany({ where: { id_opcion: { in: opcionIds } } });
        await tx.opcionesProducto.deleteMany({ where: { id_opcion: { in: opcionIds } } });
      }

      // ServicioMaterial references both material AND a ProveedorPrecio row;
      // delete it before its proveedorPrecio so the FK to it goes away.
      await tx.servicioMaterial.deleteMany({ where: { id_material: { in: allIds } } });

      // ProveedorPrecios → Gastos has nullable FK, set it null then delete.
      const proveedorPrecios = await tx.proveedorPrecios.findMany({
        where: { id_material: { in: allIds } },
        select: { id_proveedor_precio: true },
      });
      const proveedorPrecioIds = proveedorPrecios.map((p) => p.id_proveedor_precio);
      if (proveedorPrecioIds.length > 0) {
        await tx.gastos.updateMany({
          where: { id_proveedor_precio: { in: proveedorPrecioIds } },
          data: { id_proveedor_precio: null },
        });
        await tx.proveedorPrecios.deleteMany({
          where: { id_proveedor_precio: { in: proveedorPrecioIds } },
        });
      }

      await tx.detallePedido.deleteMany({ where: { id_material: { in: allIds } } });
      await tx.pedidoMaquina.deleteMany({ where: { id_material: { in: allIds } } });

      if (subIds.length > 0) {
        await tx.materiales.deleteMany({ where: { id_material: { in: subIds } } });
      }
      await tx.materiales.delete({ where: { id_material: target.id_material } });
    });

    await Promise.all(imagenKeys.map(safeDelete));
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Material ${id} no encontrado`);
    }
    throw err;
  }
}

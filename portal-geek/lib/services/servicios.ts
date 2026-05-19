import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateServicioInput, UpdateServicioInput } from "@/lib/schemas/servicios";
import { NotFoundError } from "@/lib/utils/errors";

// ─── Types ─────────────────────────────────────────────────────────────

export type ServicioListado = Prisma.ServiciosGetPayload<{
  include: {
    sucursal: true;
    maquinas: { include: { maquina: true } };
  };
}>;

export type ServicioCompleto = Prisma.ServiciosGetPayload<{
  include: {
    estatusServicio: true;
    sucursal: true;
    maquinas: { include: { maquina: true } };
    instalador: true;
    proveedor: true;
    formulas: {
      include: {
        variables: { include: { tipo: true } };
        constantes: {
          include: {
            instalador: true;
            proveedor: true;
          };
        };
      };
    };
  };
}>;

type ServicioSimple = Prisma.ServiciosGetPayload<object>;

// D1: storefront detail loads formula + servicioMateriales (no more opciones tree).
export type ServicioConDetalles = Prisma.ServiciosGetPayload<{
  include: {
    sucursal: true;
    instalador: true;
    proveedor: true;
    formulas: {
      include: {
        variables: { include: { tipo: true } };
        constantes: { include: { instalador: true; proveedor: true } };
      };
    };
    servicioMateriales: {
      include: { material: true; proveedorPrecio: true };
    };
  };
}>;

// ─── Functions ─────────────────────────────────────────────────────────

export async function listServicios(
  page: number,
  pageSize: number,
  soloActivos?: boolean,
  query?: string
): Promise<{ items: ServicioListado[]; total: number }> {
  const skip = (page - 1) * pageSize;

  // ST-18: accent + case insensitive search.
  // Prisma's `mode: "insensitive"` lowercases but does NOT strip diacritics
  // ("Láser" stays accented), so a search for "laser" misses it. We use the
  // unaccent() Postgres extension on both column and term to normalize them.
  //
  // Copilot review #7 (deferred): for large catalogs this loads all matching IDs
  // into memory and then runs a `WHERE id IN (...)` hydrate. Once the catalog
  // grows past ~1k active servicios, migrate to a single $queryRaw that does
  // LIMIT/OFFSET in SQL + a separate COUNT(*) query, then hydrate by id range.
  if (query && query.trim().length > 0) {
    const trimmed = query.trim();
    // lower(unaccent(…)) — unaccent first (strips diacritics to ASCII) THEN
    // lower (which works the same on ASCII regardless of locale). The reverse
    // order misses uppercase-accented inputs ("LÁSER") under some locales.
    const matchedIds = await prisma.$queryRaw<Array<{ id_servicio: number }>>`
      SELECT "id_servicio" FROM "SERVICIOS"
      WHERE (${soloActivos ?? false}::boolean = false OR "estatus_servicio" = true)
        AND (
          lower(unaccent("nombre_servicio")) LIKE '%' || lower(unaccent(${trimmed})) || '%'
          OR (
            "descripcion_servicio" IS NOT NULL
            AND lower(unaccent("descripcion_servicio")) LIKE '%' || lower(unaccent(${trimmed})) || '%'
          )
        )
    `;
    const ids = matchedIds.map((r) => r.id_servicio);
    if (ids.length === 0) return { items: [], total: 0 };

    const items = await prisma.servicios.findMany({
      where: { id_servicio: { in: ids } },
      skip,
      take: pageSize,
      orderBy: { fecha_modificacion: "desc" },
      include: {
        sucursal: true,
        maquinas: { include: { maquina: true } },
      },
    });
    return { items, total: ids.length };
  }

  const where: Prisma.ServiciosWhereInput = {};
  if (soloActivos) where.estatus_servicio = true;

  const [items, total] = await Promise.all([
    prisma.servicios.findMany({
      skip,
      take: pageSize,
      orderBy: { fecha_modificacion: "desc" },
      where,
      include: {
        sucursal: true,
        maquinas: { include: { maquina: true } },
      },
    }),
    prisma.servicios.count({ where }),
  ]);

  return { items, total };
}

// Storefront detail loader. Returns the servicio plus its Activa formula
// (with variables/constantes) and the list of materials available for the
// customer to pick. D1: throws NotFoundError if no Activa formula exists —
// the storefront refuses to render servicios without a configured formula.
export async function getServicioWithDetails(
  id: number
): Promise<{ servicio: ServicioConDetalles }> {
  const servicio = await prisma.servicios.findFirst({
    where: { id_servicio: id, estatus_servicio: true },
    include: {
      sucursal: true,
      instalador: true,
      proveedor: true,
      formulas: {
        where: { estatus: "Activa" },
        include: {
          variables: { include: { tipo: true } },
          constantes: { include: { instalador: true, proveedor: true } },
        },
      },
      servicioMateriales: {
        include: { material: true, proveedorPrecio: true },
      },
    },
  });

  if (!servicio) {
    throw new NotFoundError(`Servicio con id ${id} no encontrado`);
  }
  if (servicio.formulas.length === 0) {
    throw new NotFoundError(
      `Servicio con id ${id} no está disponible para cotizar (sin fórmula activa)`
    );
  }

  return { servicio };
}

export async function getServicio(id: number): Promise<ServicioCompleto> {
  const servicio = await prisma.servicios.findUnique({
    where: { id_servicio: id },
    include: {
      estatusServicio: true,
      sucursal: true,
      maquinas: { include: { maquina: true } },
      instalador: true,
      proveedor: true,
      formulas: {
        where: { estatus: "Activa" },
        include: {
          variables: { include: { tipo: true } },
          constantes: {
            include: {
              instalador: true,
              proveedor: true,
            },
          },
        },
      },
    },
  });

  if (!servicio) {
    throw new NotFoundError(`Servicio con id ${id} no encontrado`);
  }
  return servicio;
}

export async function createServicio(
  data: CreateServicioInput,
  id_usuario: number
): Promise<ServicioSimple> {
  const { id_maquinas, formula, materiales, ...servicioData } = data;

  return prisma.$transaction(async (tx) => {
    // 1. Resolve the "Activo" EstatusServicio — frontend does not send id_estatus.
    const estatusActivo = await tx.estatusServicio.findFirstOrThrow({
      where: { descripcion: "Activo" },
    });

    const servicio = await tx.servicios.create({
      data: {
        ...servicioData,
        id_estatus: estatusActivo.id_estatus_servicio,
      } as Prisma.ServiciosUncheckedCreateInput,
    });

    // 2. Vinculate machines if provided.
    if (id_maquinas && id_maquinas.length > 0) {
      await tx.servicioMaquina.createMany({
        data: id_maquinas.map((id_maquina) => ({
          id_servicio: servicio.id_servicio,
          id_maquina,
        })),
      });
    }

    // 3. Vinculate materials if provided.
    if (materiales && materiales.length > 0) {
      await tx.servicioMaterial.createMany({
        data: materiales.map((m) => ({
          id_servicio: servicio.id_servicio,
          id_material: m.id_material,
          id_proveedor_precio: m.id_proveedor_precio ?? null,
        })),
      });
    }

    // 4. Create formula with its variables and constants if provided.
    if (formula) {
      const formulaCreada = await tx.formulas.create({
        data: {
          id_servicio: servicio.id_servicio,
          expresion: formula.expresion,
          estatus: "Activa",
          id_usuario_creo: id_usuario,
        },
      });

      if (formula.variables.length > 0) {
        await tx.formulaVariables.createMany({
          data: formula.variables.map((v) => ({
            id_formula: formulaCreada.id_formula,
            id_tipo_variable: v.id_tipo_variable,
            nombre_variable: v.nombre_variable,
            etiqueta: v.etiqueta,
            valor_default: v.valor_default ?? null,
            editable_por_cliente: v.editable_por_cliente,
            unidad: v.unidad ?? null,
            estatus: "Activo",
          })),
        });
      }

      if (formula.constantes.length > 0) {
        await tx.formulaConstantes.createMany({
          data: formula.constantes.map((c) => ({
            id_formula: formulaCreada.id_formula,
            nombre_constante: c.nombre_constante,
            origen: c.origen,
            valor: c.valor ?? null,
            id_instalador: c.id_instalador ?? null,
            id_proveedor: c.id_proveedor ?? null,
            estatus: "Activo",
          })),
        });
      }
    }

    return servicio;
  });
}

export async function updateServicio(
  id: number,
  data: UpdateServicioInput,
  id_usuario: number
): Promise<ServicioSimple> {
  const { id_maquinas, formula, ...servicioData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      const servicio = await tx.servicios.update({
        where: { id_servicio: id },
        data: servicioData,
      });

      // Resync machines: drop old vinculations and create new ones.
      if (id_maquinas !== undefined) {
        await tx.servicioMaquina.deleteMany({ where: { id_servicio: id } });
        if (id_maquinas.length > 0) {
          await tx.servicioMaquina.createMany({
            data: id_maquinas.map((id_maquina) => ({
              id_servicio: id,
              id_maquina,
            })),
          });
        }
      }

      // Replace formula: deactivate the previous one and create a new active one.
      if (formula !== undefined) {
        await tx.formulas.updateMany({
          where: { id_servicio: id, estatus: "Activa" },
          data: { estatus: "Inactiva" },
        });

        const formulaCreada = await tx.formulas.create({
          data: {
            id_servicio: id,
            expresion: formula.expresion,
            estatus: "Activa",
            id_usuario_creo: id_usuario,
          },
        });

        if (formula.variables.length > 0) {
          await tx.formulaVariables.createMany({
            data: formula.variables.map((v) => ({
              id_formula: formulaCreada.id_formula,
              id_tipo_variable: v.id_tipo_variable,
              nombre_variable: v.nombre_variable,
              etiqueta: v.etiqueta,
              valor_default: v.valor_default ?? null,
              editable_por_cliente: v.editable_por_cliente,
              unidad: v.unidad ?? null,
              estatus: "Activo",
            })),
          });
        }

        if (formula.constantes.length > 0) {
          await tx.formulaConstantes.createMany({
            data: formula.constantes.map((c) => ({
              id_formula: formulaCreada.id_formula,
              nombre_constante: c.nombre_constante,
              origen: c.origen,
              valor: c.valor ?? null,
              id_instalador: c.id_instalador ?? null,
              id_proveedor: c.id_proveedor ?? null,
              estatus: "Activo",
            })),
          });
        }
      }

      return servicio;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError(`Servicio con id ${id} no encontrado`);
    }
    throw error;
  }
}

export async function deleteServicio(id: number): Promise<void> {
  try {
    await prisma.servicios.update({
      where: { id_servicio: id },
      data: { estatus_servicio: false },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError(`Servicio con id ${id} no encontrado`);
    }
    throw error;
  }
}

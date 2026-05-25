import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateServicioInput, UpdateServicioInput } from "@/lib/schemas/servicios";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import type { ServicioAdminDetalle } from "@/types/servicios";

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
// (if one exists) and the list of materials available for the customer.
// KIKW12 review #5: empty formulas array is a valid state — the page renders
// a "Cotización en línea no disponible" fallback instead of 404'ing, so the
// catalog card still resolves and the cliente can request a manual quote.
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

export type ServicioParaAdmin = Prisma.ServiciosGetPayload<{
  include: {
    sucursal: true;
    maquinas: { include: { maquina: true } };
    instalador: true;
    proveedor: true;
    formulas: {
      include: {
        variables: { include: { tipo: true } };
        constantes: { include: { instalador: true; proveedor: true } };
      };
    };
    servicioMateriales: { include: { material: true } };
  };
}>;

export async function getServicioParaAdmin(id: number): Promise<ServicioParaAdmin> {
  const servicio = await prisma.servicios.findFirst({
    where: { id_servicio: id, estatus_servicio: true },
    include: {
      sucursal: true,
      maquinas: { include: { maquina: true } },
      instalador: true,
      proveedor: true,
      formulas: {
        where: { estatus: "Activa" },
        orderBy: { fecha_creacion: "desc" },
        take: 1,
        include: {
          variables: { include: { tipo: true } },
          constantes: { include: { instalador: true, proveedor: true } },
        },
      },
      servicioMateriales: { include: { material: true } },
    },
  });

  if (!servicio) throw new NotFoundError(`Servicio con id ${id} no encontrado`);
  return servicio;
}

export function toServicioAdminDetalle(s: ServicioParaAdmin): ServicioAdminDetalle {
  const formulaActiva = s.formulas[0] ?? null;
  return {
    id_servicio: s.id_servicio,
    nombre_servicio: s.nombre_servicio,
    descripcion_servicio: s.descripcion_servicio,
    id_sucursal: s.id_sucursal,
    sucursal: { id_sucursal: s.sucursal.id_sucursal, nombre_sucursal: s.sucursal.nombre_sucursal },
    id_instalador: s.id_instalador,
    costo_instalador_override: s.costo_instalador_override?.toString() ?? null,
    instalador: s.instalador
      ? {
          id_instalador: s.instalador.id_instalador,
          nombre_instalador: s.instalador.nombre_instalador,
          apodo: s.instalador.apodo,
          costo_instalacion: s.instalador.costo_instalacion.toString(),
        }
      : null,
    id_proveedor: s.id_proveedor,
    costo_proveedor_override: s.costo_proveedor_override?.toString() ?? null,
    proveedor: s.proveedor
      ? {
          id_proveedor: s.proveedor.id_proveedor,
          nombre_proveedor: s.proveedor.nombre_proveedor,
          costo: s.proveedor.costo?.toString() ?? null,
        }
      : null,
    maquinas: s.maquinas.map((m) => ({
      maquina: {
        id_maquina: m.maquina.id_maquina,
        nombre_maquina: m.maquina.nombre_maquina,
        apodo_maquina: m.maquina.apodo_maquina,
        tipo: m.maquina.tipo,
      },
    })),
    materiales: s.servicioMateriales.map((m) => ({
      id_servicio_material: m.id_servicio_material,
      id_material: m.id_material,
      id_proveedor_precio: m.id_proveedor_precio,
      material: {
        id_material: m.material.id_material,
        nombre_material: m.material.nombre_material,
        descripcion_material: m.material.descripcion_material,
        unidad_medida: m.material.unidad_medida ?? "",
        ancho: m.material.ancho?.toString() ?? null,
        alto: m.material.alto?.toString() ?? null,
        grosor: m.material.grosor?.toString() ?? null,
        color: m.material.color,
      },
    })),
    formulaActiva: formulaActiva
      ? {
          id_formula: formulaActiva.id_formula,
          expresion: formulaActiva.expresion,
          variables: formulaActiva.variables.map((v) => ({
            id_variable: v.id_variable,
            id_tipo_variable: v.id_tipo_variable,
            nombre_variable: v.nombre_variable,
            etiqueta: v.etiqueta,
            valor_default: v.valor_default?.toString() ?? null,
            editable_por_cliente: v.editable_por_cliente,
            unidad: v.unidad,
          })),
          constantes: formulaActiva.constantes.map((c) => ({
            id_constante: c.id_constante,
            nombre_constante: c.nombre_constante,
            origen: c.origen,
            valor: c.valor?.toString() ?? null,
            id_instalador: c.id_instalador,
            id_proveedor: c.id_proveedor,
          })),
        }
      : null,
  };
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

async function validateServicioFKs(
  tx: Prisma.TransactionClient,
  data: UpdateServicioInput
): Promise<void> {
  if (data.id_sucursal !== undefined) {
    const found = await tx.sucursales.findFirst({ where: { id_sucursal: data.id_sucursal } });
    if (!found) throw new ValidationError(`Sucursal con id ${data.id_sucursal} no encontrada`);
  }
  if (data.id_instalador != null) {
    const found = await tx.instaladores.findFirst({ where: { id_instalador: data.id_instalador } });
    if (!found) throw new ValidationError(`Instalador con id ${data.id_instalador} no encontrado`);
  }
  if (data.id_proveedor != null) {
    const found = await tx.proveedores.findFirst({ where: { id_proveedor: data.id_proveedor } });
    if (!found) throw new ValidationError(`Proveedor con id ${data.id_proveedor} no encontrado`);
  }
  if (data.id_maquinas && data.id_maquinas.length > 0) {
    const uniqueMachineIds = Array.from(new Set(data.id_maquinas));
    const found = await tx.maquinas.findMany({
      where: { id_maquina: { in: uniqueMachineIds } },
      select: { id_maquina: true },
    });
    if (found.length !== uniqueMachineIds.length) {
      const foundIds = new Set(found.map((m) => m.id_maquina));
      const missing = uniqueMachineIds.filter((id_maq) => !foundIds.has(id_maq));
      throw new ValidationError(`Máquinas no encontradas: ${missing.join(", ")}`);
    }
  }
  if (data.materiales && data.materiales.length > 0) {
    const uniqueMaterialIds = Array.from(new Set(data.materiales.map((m) => m.id_material)));
    const found = await tx.materiales.findMany({
      where: { id_material: { in: uniqueMaterialIds } },
      select: { id_material: true },
    });
    if (found.length !== uniqueMaterialIds.length) {
      const foundIds = new Set(found.map((m) => m.id_material));
      const missing = uniqueMaterialIds.filter((id_mat) => !foundIds.has(id_mat));
      throw new ValidationError(`Materiales no encontrados: ${missing.join(", ")}`);
    }
  }
}

export async function updateServicio(
  id: number,
  data: UpdateServicioInput,
  id_usuario: number
): Promise<ServicioAdminDetalle> {
  const existing = await prisma.servicios.findFirst({
    where: { id_servicio: id, estatus_servicio: true },
  });
  if (!existing) throw new NotFoundError(`Servicio con id ${id} no encontrado`);

  const { id_maquinas, formula, materiales, ...servicioData } = data;

  await prisma.$transaction(async (tx) => {
    await validateServicioFKs(tx, data);

    await tx.servicios.update({ where: { id_servicio: id }, data: servicioData });

    if (id_maquinas !== undefined) {
      await tx.servicioMaquina.deleteMany({ where: { id_servicio: id } });
      if (id_maquinas.length > 0) {
        await tx.servicioMaquina.createMany({
          data: id_maquinas.map((id_maquina) => ({ id_servicio: id, id_maquina })),
        });
      }
    }

    if (materiales !== undefined) {
      await tx.servicioMaterial.deleteMany({ where: { id_servicio: id } });
      if (materiales.length > 0) {
        await tx.servicioMaterial.createMany({
          data: materiales.map((m) => ({
            id_servicio: id,
            id_material: m.id_material,
            id_proveedor_precio: m.id_proveedor_precio ?? null,
          })),
        });
      }
    }

    if (formula !== undefined) {
      const formulasActivas = await tx.formulas.findMany({
        where: { id_servicio: id, estatus: "Activa" },
        select: { id_formula: true },
      });
      if (formulasActivas.length > 0) {
        await tx.formulaVariables.updateMany({
          where: { id_formula: { in: formulasActivas.map((f) => f.id_formula) } },
          data: { estatus: "Inactivo" },
        });
      }
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
  });

  return toServicioAdminDetalle(await getServicioParaAdmin(id));
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

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateServicioInput, UpdateServicioInput } from "@/lib/schemas/servicios";
import { NotFoundError } from "@/lib/utils/errors";
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

export type ServicioConDetalles = Prisma.ServiciosGetPayload<{
  include: {
    opciones: {
      include: {
        material: true;
        valores: {
          include: {
            matriz: true;
          };
        };
      };
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

  const where: Prisma.ServiciosWhereInput = {};
  if (soloActivos) where.estatus_servicio = true;
  if (query) {
    where.OR = [
      { nombre_servicio: { contains: query, mode: "insensitive" } },
      { descripcion_servicio: { contains: query, mode: "insensitive" } },
    ];
  }

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

export async function getServicioWithDetails(
  id: number
): Promise<{ servicio: ServicioConDetalles; precioBase: number | null }> {
  const servicio = await prisma.servicios.findFirst({
    where: { id_servicio: id, estatus_servicio: true },
    include: {
      opciones: {
        include: {
          material: true,
          valores: {
            orderBy: { es_default: "desc" },
            include: {
              matriz: { orderBy: { precio_unitario: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!servicio) {
    throw new NotFoundError(`Servicio con id ${id} no encontrado`);
  }

  let precioBase: number | null = null;
  for (const opcion of servicio.opciones) {
    for (const valor of opcion.valores) {
      for (const precio of valor.matriz) {
        const p = Number(precio.precio_unitario);
        if (precioBase === null || p < precioBase) {
          precioBase = p;
        }
      }
    }
  }

  return { servicio, precioBase };
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
        unidad_medida: m.material.unidad_medida,
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

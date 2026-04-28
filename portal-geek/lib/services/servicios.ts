import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import { NotFoundError } from "@/lib/utils/errors";
import type {
  CreateServicioInput,
  UpdateServicioInput,
} from "@/lib/schemas/servicios";

// ─── Types ─────────────────────────────────────────────────────────────


export type ServicioListado = Prisma.ServiciosGetPayload<{
  include: {
    maquinas: {
      include: { maquina: true };
    };
  };
}>;


export type ServicioCompleto = Prisma.ServiciosGetPayload<{
  include: {
    estatusServicio: true;
    maquinas: { include: { maquina: true } };
    instalador: true;
    proveedor: true;
    formulas: {
      include: {
        variables: { include: { tipo: true } };
        constantes: {
          include: {
            maquina: true;
            instalador: true;
            proveedor: true;
          };
        };
      };
    };
  };
}>;


type ServicioSimple = Prisma.ServiciosGetPayload<object>;

// ─── Functions ─────────────────────────────────────────────────────────

/*
Servicios list paginated with total count for pagination controls.
Sorted by fecha_modificacion desc (most recently updated first).
*/
export async function listServicios(
  page: number,
  pageSize: number
): Promise<{ items: ServicioListado[]; total: number }> {
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.servicios.findMany({
      skip,
      take: pageSize,
      orderBy: { fecha_modificacion: "desc" },
      include: {
        maquinas: {
          include: { maquina: true },
        },
      },
    }),
    prisma.servicios.count(),
  ]);

  return { items, total };
}

/*
Get a single service by ID with all its relations.
Throws NotFoundError if the service does not exist.
*/
export async function getServicio(id: number): Promise<ServicioCompleto> {
  const servicio = await prisma.servicios.findUnique({
    where: { id_servicio: id },
    include: {
      estatusServicio: true,
      maquinas: { include: { maquina: true } },
      instalador: true,
      proveedor: true,
      formulas: {
        where: { estatus: "Activa" },
        include: {
          variables: { include: { tipo: true } },
          constantes: {
            include: {
              maquina: true,
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

/*
Create a new service with optional machine vinculations and formula.
All operations run in a transaction: if any step fails, nothing is persisted.
*/
export async function createServicio(
  data: CreateServicioInput,
  id_usuario: number
): Promise<ServicioSimple> {
  const { id_maquinas, formula, ...servicioData } = data;

  return prisma.$transaction(async (tx) => {
    // 1. Create the service first.
    const servicio = await tx.servicios.create({ data: servicioData });

    // 2. Vinculate machines if provided.
    if (id_maquinas && id_maquinas.length > 0) {
      await tx.servicioMaquina.createMany({
        data: id_maquinas.map((id_maquina) => ({
          id_servicio: servicio.id_servicio,
          id_maquina,
        })),
      });
    }

    // 3. Create formula if provided, with its variables and constants.
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
            id_maquina: c.id_maquina ?? null,
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

/*
Updates a service and resyncs its machines and formula if new arrays are provided.
Old formulas are deactivated (soft delete) instead of being removed,
preserving historical data for past quotations.
*/
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
              id_maquina: c.id_maquina ?? null,
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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError(`Servicio con id ${id} no encontrado`);
    }
    throw error;
  }
}

/*
Changes estatus_servicio to false in order to preserve historical data
*/
export async function deleteServicio(id: number): Promise<void> {
  try {
    await prisma.servicios.update({
      where: { id_servicio: id },
      data: { estatus_servicio: false },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError(`Servicio con id ${id} no encontrado`);
    }
    throw error;
  }
}
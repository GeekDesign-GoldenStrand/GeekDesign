import type { Servicios } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import { NotFoundError } from "@/lib/utils/errors";
import type { CreateServicioInput, UpdateServicioInput } from "@/lib/schemas/servicios";

/*
Servicios list paginated with total count for pagination controls. Sorted by id_servicio desc (newest first).
*/
export async function listServicios(
  page: number,
  pageSize: number
): Promise<{ items: Servicios[]; total: number }> {
  // TODO: implement
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.servicios.findMany({
      skip,
      take: pageSize,
      orderBy: { id_servicio: "desc" },
    }),
    prisma.servicios.count(),
  ]);

  return { items, total };
}

/*
Get a single service by an ID. Throws NotFoundError if the service does not exist.
*/

export async function getServicio(id: number): Promise<Servicios> {
  const servicio = await prisma.servicios.findUnique({
    where: { id_servicio: id },
    include:{
      estatusServicio: true,
      maquinas: { include: { maquina: true } },
      instaladorServicios: { include: { instalador: true } },
      proveedores: { include: { proveedor: true } },
      formulas: {
        where: { estatus: "Activa" },
        include: {
          variables: {include: {tipo:true}},
          constantes: {include:{maquina: true, instalador: true, proveedor: true},
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
Create a new service with the provided data. Returns the created service. Throws AppError on validation 
failure or other issues.
*/
export async function createServicio(data: CreateServicioInput, id_usuario: number): Promise<Servicios> {
  const { id_maquinas, id_instaladores, id_proveedores, formula, ...servicioData } = data;

  return prisma.$transaction(async (tx) => {
    // Here the service is created first, then the relations are created in their respective tables. 
    // This is to ensure that if any of the relations fail to be created, the whole transaction will 
    // be rolled back and we won't end up with orphaned relations without a service.
    const servicio = await tx.servicios.create({ data: servicioData });

    // Afterwards it is vinculated to a machine 
    if (id_maquinas && id_maquinas.length > 0) {
      await tx.servicioMaquina.createMany({
        data: id_maquinas.map((id_maquina) => ({
          id_servicio: servicio.id_servicio,
          id_maquina,
        })),
      });
    }

    //If it´s needed it is vinculated to an installer
    if (id_instaladores && id_instaladores.length > 0) {
      await tx.instaladorServicios.createMany({
        data: id_instaladores.map((id_instalador) => ({
          id_servicio: servicio.id_servicio,
          id_instalador,
        })),
      });
    }

    //Then to a provider
    if (id_proveedores && id_proveedores.length > 0) {
      await tx.servicioProveedor.createMany({
        data: id_proveedores.map((id_proveedor) => ({
          id_servicio: servicio.id_servicio,
          id_proveedor,
        })),
      });
    }

    // Finally, if there is a formula, it is created and vinculated to the service.
    if (formula) {
      const formulaCreada = await tx.formulas.create({
        data: {
          id_servicio: servicio.id_servicio,
          expresion: formula.expresion,
          estatus: "Activa",
          id_usuario_creo: id_usuario,
        },
      });

      // If there are variables, they are created and vinculated to the formula.
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
      // If there are constantes, they are created and vinculated to the formula.     
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
Updates a service and resincs their latch if there are new arrays.
*/
export async function updateServicio(id: number, data: UpdateServicioInput, id_usuario: number): Promise<Servicios> {
  const { id_maquinas, id_instaladores, id_proveedores, formula, ...servicioData } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      const servicio = await tx.servicios.update({
        where: { id_servicio: id },
        data: servicioData,
      });

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

      if (id_instaladores !== undefined) {
        await tx.instaladorServicios.deleteMany({ where: { id_servicio: id } });
        if (id_instaladores.length > 0) {
          await tx.instaladorServicios.createMany({
            data: id_instaladores.map((id_instalador) => ({
              id_servicio: id,
              id_instalador,
            })),
          });
        }
      }

      if (id_proveedores !== undefined) {
        await tx.servicioProveedor.deleteMany({ where: { id_servicio: id } });
        if (id_proveedores.length > 0) {
          await tx.servicioProveedor.createMany({
            data: id_proveedores.map((id_proveedor) => ({
              id_servicio: id,
              id_proveedor,
            })),
          });
        }
      }

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
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
    ) {
      throw new NotFoundError(`Servicio con id ${id} no encontrado`);
    }
    throw error;
  }
}

/*
Deletes a service: technically changes estatus_servicio to false in order to not lose historical data. 
*/

export async function deleteServicio(id: number): Promise<void> {
  try {
      await prisma.servicios.update({
        where: { id_servicio: id },
        data: { estatus_servicio: false },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
      ) {
        throw new NotFoundError(`Servicio con id ${id} no encontrado`);
      }
      throw error;
    }
}

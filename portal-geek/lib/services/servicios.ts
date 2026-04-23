import type { Servicios } from "@prisma/client";
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

export async function getServicios(id: number): Promise<Servicios> {
  const servicio = await prisma.servicios.findUnique({
    where: { id_servicio: id },
  });

  if (!servicio) {
    throw new NotFoundError(`Servicio con id ${id} no encontrado`);
  }

  return servicio;

}

/*
Create a new service with the provided data. Returns the created service. Throws AppError on validation failure or other issues.
*/
export async function createServicio(data: CreateServicioInput): Promise<Servicios> {
  const { id_maquinas, id_instaladores, id_proveedores, ...servicioData } = data;

  return prisma.$transaction(async (tx) => {
    const servicio = await tx.servicios.create({ data: servicioData });

    if (id_maquinas && id_maquinas.length > 0) {
      await tx.servicioMaquina.createMany({
        data: id_maquinas.map((id_maquina) => ({
          id_servicio: servicio.id_servicio,
          id_maquina,
        })),
      });
    }

    if (id_instaladores && id_instaladores.length > 0) {
      await tx.instaladorServicios.createMany({
        data: id_instaladores.map((id_instalador) => ({
          id_servicio: servicio.id_servicio,
          id_instalador,
        })),
      });
    }

    if (id_proveedores && id_proveedores.length > 0) {
      await tx.servicioProveedor.createMany({
        data: id_proveedores.map((id_proveedor) => ({
          id_servicio: servicio.id_servicio,
          id_proveedor,
        })),
      });
    }

    return servicio;
  });
}

/*
Updates a service and resincs their latch if there are new arrays.
*/
export async function updateServicio(id: number, data: UpdateServicioInput): Promise<Servicios> {
  const { id_maquinas, id_instaladores, id_proveedores, ...servicioData } = data;

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

      return servicio;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError 
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
        error instanceof prisma.PrismaClientKnownRequestError
      ) {
        throw new NotFoundError(`Servicio con id ${id} no encontrado`);
      }
      throw error;
    }
}

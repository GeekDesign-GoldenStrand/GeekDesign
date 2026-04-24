import type { Servicios } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateServicioInput, UpdateServicioInput } from "@/lib/schemas/servicios";
import { NotFoundError } from "@/lib/utils/errors";

export async function listServicios(
  page: number,
  pageSize: number,
  soloActivos = false,
  query?: string
): Promise<{ items: Servicios[]; total: number }> {
  const where = {
    ...(soloActivos && { estatus_servicio: true }),
    ...(query && {
      OR: [
        { nombre_servicio: { contains: query, mode: "insensitive" as const } },
        { descripcion_servicio: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.servicios.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id_servicio: "asc" },
    }),
    prisma.servicios.count({ where }),
  ]);
  return { items, total };
}

export async function getServicio(id: number): Promise<Servicios> {
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
            include: { maquina: true, instalador: true, proveedor: true },
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

export async function getServicioWithDetails(id: number) {
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
  if (!servicio) throw new NotFoundError(`Servicio ${id} no encontrado`);

  const allPrices = servicio.opciones.flatMap((o) =>
    o.valores.flatMap((v) => v.matriz.map((m) => Number(m.precio_unitario)))
  );
  const precioBase = allPrices.length > 0 ? Math.min(...allPrices) : null;

  return { servicio, precioBase };
}

/*
Create a new service with the provided data. Returns the created service. Throws AppError on validation
failure or other issues.
*/
export async function createServicio(
  data: CreateServicioInput,
  id_usuario: number
): Promise<Servicios> {
  const { id_maquinas, formula, ...servicioData } = data;

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
export async function updateServicio(
  id: number,
  data: UpdateServicioInput,
  id_usuario: number
): Promise<Servicios> {
  const { id_maquinas, formula, ...servicioData } = data;

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

export async function deleteServicio(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}
import type { Clientes } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateClienteInput, UpdateClienteInput } from "@/lib/schemas/clientes";
import { NotFoundError } from "@/lib/utils/errors";

export async function listClientes(
  page: number,
  pageSize: number
): Promise<{ items: Clientes[]; total: number }> {
  const [items, total] = await prisma.$transaction([
    prisma.clientes.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre_cliente: "asc" },
    }),
    prisma.clientes.count(),
  ]);
  return { items, total };
}

export async function getCliente(id: number): Promise<Clientes> {
  const cliente = await prisma.clientes.findUnique({ where: { id_cliente: id } });
  if (!cliente) throw new NotFoundError(`Cliente ${id} no encontrado`);
  return cliente;
}

export async function createCliente(data: CreateClienteInput): Promise<Clientes> {
  return prisma.clientes.create({ data });
}

export async function updateCliente(id: number, data: UpdateClienteInput): Promise<Clientes> {
  try {
    return await prisma.clientes.update({ where: { id_cliente: id }, data });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Cliente ${id} no encontrado`);
    }
    throw err;
  }
}

export async function deleteCliente(id: number): Promise<void> {
  try {
    await prisma.clientes.delete({ where: { id_cliente: id } });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Cliente ${id} no encontrado`);
    }
    throw err;
  }
}

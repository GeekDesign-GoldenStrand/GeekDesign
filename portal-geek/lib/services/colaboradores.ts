import type { Colaboradores } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateColaboradorInput, UpdateColaboradorInput } from "@/lib/schemas/colaboradores";

export async function listColaboradores(
  page: number,
  pageSize: number
): Promise<{ items: Colaboradores[]; total: number }> {
  // TODO: implement
  void prisma;
  void page;
  void pageSize;
  throw new Error("Not implemented");
}

export async function getColaborador(id: number): Promise<Colaboradores> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createColaborador(data: CreateColaboradorInput): Promise<Colaboradores> {
  // TODO: implement — create Usuarios + Colaboradores in a transaction
  void data;
  throw new Error("Not implemented");
}

export async function updateColaborador(
  id: number,
  data: UpdateColaboradorInput
): Promise<Colaboradores> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteColaborador(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}

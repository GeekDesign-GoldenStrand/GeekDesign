import type { Instaladores } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateInstaladorInput, UpdateInstaladorInput } from "@/lib/schemas/instaladores";

export async function listInstaladores(
  page: number,
  pageSize: number
): Promise<{ items: Instaladores[]; total: number }> {
  // TODO: implement
  void prisma;
  void page;
  void pageSize;
  throw new Error("Not implemented");
}

export async function getInstalador(id: number): Promise<Instaladores> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createInstalador(data: CreateInstaladorInput): Promise<Instaladores> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updateInstalador(
  id: number,
  data: UpdateInstaladorInput
): Promise<Instaladores> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteInstalador(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}

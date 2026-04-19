import type { Proveedores } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateProveedorInput, UpdateProveedorInput } from "@/lib/schemas/proveedores";

export async function listProveedores(
  page: number,
  pageSize: number
): Promise<{ items: Proveedores[]; total: number }> {
  // TODO: implement
  void prisma;
  void page;
  void pageSize;
  throw new Error("Not implemented");
}

export async function getProveedor(id: number): Promise<Proveedores> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createProveedor(data: CreateProveedorInput): Promise<Proveedores> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updateProveedor(
  id: number,
  data: UpdateProveedorInput
): Promise<Proveedores> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteProveedor(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}

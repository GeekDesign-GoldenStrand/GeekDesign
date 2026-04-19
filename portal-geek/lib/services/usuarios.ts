import type { Usuarios } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateUsuarioInput, UpdateUsuarioInput } from "@/lib/schemas/usuarios";

export async function listUsuarios(
  page: number,
  pageSize: number
): Promise<{ items: Usuarios[]; total: number }> {
  // TODO: implement — exclude contrasena_hash from response
  void prisma;
  void page;
  void pageSize;
  throw new Error("Not implemented");
}

export async function getUsuario(id: number): Promise<Usuarios> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createUsuario(data: CreateUsuarioInput): Promise<Usuarios> {
  // TODO: implement — hash password before storing
  void data;
  throw new Error("Not implemented");
}

export async function updateUsuario(id: number, data: UpdateUsuarioInput): Promise<Usuarios> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteUsuario(id: number): Promise<void> {
  // TODO: implement — soft-delete by setting estatus = 'Inactivo' instead of hard delete
  void id;
  throw new Error("Not implemented");
}

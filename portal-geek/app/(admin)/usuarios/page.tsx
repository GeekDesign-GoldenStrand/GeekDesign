import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

import { UsuariosTable } from "./usuarios-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Usuarios — Geek Design" };

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session || session.role !== "Direccion") redirect("/login");

  const [usuarios, roles] = await Promise.all([
    prisma.usuarios.findMany({
      select: {
        id_usuario: true,
        nombre_completo: true,
        correo_electronico: true,
        estatus: true,
        id_rol: true,
        rol: { select: { id_rol: true, nombre_rol: true } },
      },
      orderBy: { fecha_creacion: "desc" },
    }),
    prisma.roles.findMany({ orderBy: { id_rol: "asc" } }),
  ]);

  return (
    <main className="min-h-screen bg-[#fff8f9] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-[22px] font-semibold tracking-[0.5px] text-[#333]">
          Gestión de usuarios
        </h1>
        <div className="rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <UsuariosTable usuarios={usuarios} roles={roles} />
        </div>
      </div>
    </main>
  );
}

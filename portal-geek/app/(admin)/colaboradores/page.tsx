import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { ADMIN_ROLES } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

import { ColaboradoresGrid } from "./colaboradores-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Colaboradores | Geek Design" };

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function ColaboradoresPage() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/login");

  const [raw, roles] = await Promise.all([
    prisma.usuarios.findMany({
      select: {
        id_usuario: true,
        nombre_completo: true,
        correo_electronico: true,
        estatus: true,
        id_rol: true,
        rol: { select: { id_rol: true, nombre_rol: true } },
        colaborador: {
          select: {
            edad: true,
            sexo: true,
            telefono: true,
            fecha_modificacion: true,
            sucursal: { select: { nombre_sucursal: true } },
          },
        },
      },
      orderBy: { fecha_creacion: "desc" },
    }),
    prisma.roles.findMany({ orderBy: { id_rol: "asc" } }),
  ]);

  const colaboradores = raw.map((u) => ({
    id_usuario: u.id_usuario,
    nombre_completo: u.nombre_completo,
    correo_electronico: u.correo_electronico,
    estatus: u.estatus,
    id_rol: u.id_rol,
    rol: u.rol,
    edad: u.colaborador?.edad ?? null,
    sexo: u.colaborador?.sexo ?? null,
    sucursal: u.colaborador?.sucursal?.nombre_sucursal ?? null,
    telefono: u.colaborador?.telefono ?? null,
    fecha_modificacion: u.colaborador?.fecha_modificacion
      ? formatDate(u.colaborador.fecha_modificacion)
      : null,
  }));

  return (
    <>
      <AdminHeader title="Colaboradores" />
      <ColaboradoresGrid colaboradores={colaboradores} roles={roles} />
    </>
  );
}

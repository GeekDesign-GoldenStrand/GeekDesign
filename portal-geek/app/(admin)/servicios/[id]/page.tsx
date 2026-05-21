import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ADMIN_ROLES } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getServicioParaAdmin, toServicioAdminDetalle } from "@/lib/services/servicios";
import { NotFoundError } from "@/lib/utils/errors";
import type { ServicioAdminDetalle } from "@/types/servicios";

import { ViewDetalleServicio } from "./view-detalleServicio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Detalle de servicio | Geek Design" };

type Props = { params: Promise<{ id: string }> };

async function fetchServicio(id: number): Promise<ServicioAdminDetalle | null> {
  try {
    const raw = await getServicioParaAdmin(id);
    return toServicioAdminDetalle(raw);
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}

export default async function DetalleServicioPage({ params }: Props) {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/login");

  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (isNaN(idNum)) notFound();

  const servicio = await fetchServicio(idNum);
  if (!servicio) notFound();

  return <ViewDetalleServicio servicio={servicio} />;
}

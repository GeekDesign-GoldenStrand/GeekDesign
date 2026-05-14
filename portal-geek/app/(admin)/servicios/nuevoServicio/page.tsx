import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ADMIN_ROLES } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";

import { ViewNuevoServicio } from "./view-NuevoServicio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nuevo servicio | Geek Design" };

export default async function NuevoServicioPage() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/login");

  return <ViewNuevoServicio />;
}

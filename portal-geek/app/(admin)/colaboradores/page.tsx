import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ADMIN_ROLES } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";

import { ColaboradoresView } from "./colaboradores-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Colaboradores" };

export default async function ColaboradoresPage() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/login");

  return <ColaboradoresView />;
}

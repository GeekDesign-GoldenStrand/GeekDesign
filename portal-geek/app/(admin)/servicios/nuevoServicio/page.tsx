import type { Metadata } from "next";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";

import { ViewNuevoServicio } from "./view-NuevoServicio";

// Role/section access is enforced in ../layout.tsx (requireSection("servicios")).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nuevo servicio | Geek Design" };

export default function NuevoServicioPage() {
  return (
    <div>
      <AdminHeader title="Registrar nuevo servicio" />
      <ViewNuevoServicio />
    </div>
  );
}

import type { Metadata } from "next";

import { ViewNuevoServicio } from "./view-NuevoServicio";

// Role/section access is enforced in ../layout.tsx (requireSection("servicios")).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nuevo servicio | Geek Design" };

export default function NuevoServicioPage() {
  return <ViewNuevoServicio />;
}

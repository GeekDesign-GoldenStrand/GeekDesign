"use client";

import { ServicioForm } from "@/components/admin/servicios/organisms/ServicioForm";

export function ViewNuevoServicio() {
  return (
    <div className="p-8">
      <ServicioForm mode="create" />
    </div>
  );
}

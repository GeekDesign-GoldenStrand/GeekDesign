"use client";

import { ServicioForm } from "@/components/admin/servicios/organisms/ServicioForm";

export function ViewNuevoServicio() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-[#1e1e1e] mb-6">Registrar nuevo servicio</h1>
      <ServicioForm mode="create" />
    </div>
  );
}

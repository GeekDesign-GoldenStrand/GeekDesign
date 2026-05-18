"use client";

import { SucursalForm, type SucursalFormData } from "@/components/admin/organisms/SucursalForm";

// The form stores branch hours as HH:mm strings because that is what the time input needs.
// The API expects DateTime values, so we attach a fixed date to keep Prisma compatibility.
function buildSucursalPayload(data: SucursalFormData) {
  return {
    nombre_sucursal: data.nombre_sucursal,
    direccion: data.direccion,
    horario_apertura: data.horario_apertura
      ? new Date(`1970-01-01T${data.horario_apertura}:00.000Z`).toISOString()
      : null,
    horario_salida: data.horario_salida
      ? new Date(`1970-01-01T${data.horario_salida}:00.000Z`).toISOString()
      : null,
    estatus: data.estatus,
  };
}

export default function RegistrarSucursalPage() {
  async function handleCreate(data: SucursalFormData) {
    // The create page only sends branch fields.
    // Relations are managed from their own modules to keep responsibilities separated.
    const res = await fetch("/api/sucursales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildSucursalPayload(data)),
    });

    if (!res.ok) {
      throw new Error("Error creating sucursal");
    }
  }

  return <SucursalForm mode="create" onSubmit={handleCreate} />;
}

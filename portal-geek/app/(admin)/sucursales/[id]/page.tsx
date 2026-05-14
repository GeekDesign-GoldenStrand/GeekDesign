"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { SucursalForm, type SucursalFormData } from "@/components/admin/organisms/SucursalForm";

type ApiSucursal = {
  id_sucursal: number;
  nombre_sucursal: string;
  direccion: string;
  horario_apertura?: string | null;
  horario_salida?: string | null;
  estatus: "Activo" | "Inactivo";
  pedidos?: { id_pedido: number }[];
  colaboradores?: {
    id_colaborador: number;
    usuario?: {
      nombre?: string | null;
      email?: string | null;
    };
  }[];
  maquinas?: {
    id_sucursal_maquina: number;
    maquina?: {
      id_maquina: number;
      nombre_maquina: string;
    };
  }[];
};

// Branch schedules are stored as DateTime values, but the UI only needs the time.
// UTC prevents browser timezone conversion from shifting business hours.
function timeFromDate(value?: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

// The form works with simple HH:mm strings, while the API expects DateTime values.
// Using a fixed date keeps the value compatible with Prisma without treating it as a real calendar date.
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

export default function EditarSucursalPage() {
  const params = useParams<{ id: string }>();

  // The form is rendered only after the branch data is loaded.
  // This avoids showing empty editable fields for an existing record.
  const [initialData, setInitialData] = useState<SucursalFormData | null>(null);

  useEffect(() => {
    async function loadSucursal() {
      const res = await fetch(`/api/sucursales/${params.id}`);

      if (!res.ok) {
        throw new Error("Error loading sucursal");
      }

      const json = await res.json();
      const sucursal: ApiSucursal = json.data;

      // API relations are normalized into a small UI-friendly shape.
      // This keeps SucursalForm reusable and independent from Prisma relation names.
      setInitialData({
        nombre_sucursal: sucursal.nombre_sucursal,
        direccion: sucursal.direccion,
        horario_apertura: timeFromDate(sucursal.horario_apertura),
        horario_salida: timeFromDate(sucursal.horario_salida),
        estatus: sucursal.estatus,

        pedidos:
          sucursal.pedidos?.map((pedido) => ({
            id: pedido.id_pedido,
            name: `Pedido ${pedido.id_pedido}`,
          })) ?? [],

        colaboradores:
          sucursal.colaboradores?.map((colaborador) => ({
            id: colaborador.id_colaborador,
            name:
              colaborador.usuario?.nombre ??
              colaborador.usuario?.email ??
              `Colaborador ${colaborador.id_colaborador}`,
          })) ?? [],

        maquinas:
          sucursal.maquinas?.map((item) => ({
            id: item.maquina?.id_maquina ?? item.id_sucursal_maquina,
            name: item.maquina?.nombre_maquina ?? "Máquina sin nombre",
          })) ?? [],
      });
    }

    loadSucursal();
  }, [params.id]);

  async function handleUpdate(data: SucursalFormData) {
    const res = await fetch(`/api/sucursales/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildSucursalPayload(data)),
    });

    if (!res.ok) {
      throw new Error("Error updating sucursal");
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/sucursales/${params.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Error deleting sucursal");
    }
  }

  if (!initialData) {
    return <div className="p-10 text-[#1e1e1e]">Cargando sucursal...</div>;
  }

  return (
    <SucursalForm
      mode="edit"
      initialData={initialData}
      onSubmit={handleUpdate}
      onDelete={handleDelete}
    />
  );
}

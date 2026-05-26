"use client";

import { useRouter } from "next/navigation";

import { ServicioForm } from "@/components/admin/servicios/organisms/ServicioForm";
import { mapServicioDetalladoToFormState } from "@/lib/utils/servicio-mappers";
import type { ServicioAdminDetalle } from "@/types/servicios";

type Props = { servicio: ServicioAdminDetalle };

export function ViewEditarServicio({ servicio }: Props) {
  const router = useRouter();
  const initialData = mapServicioDetalladoToFormState(servicio);

  const handleSuccess = () => {
    router.push(`/servicios/${servicio.id_servicio}`);
    router.refresh();
  };

  const handleCancel = () => {
    router.push(`/servicios/${servicio.id_servicio}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold text-[#1e1e1e] mb-6">
        Editar: {servicio.nombre_servicio}
      </h1>
      <ServicioForm
        mode="edit"
        servicioId={servicio.id_servicio}
        initialData={initialData}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}

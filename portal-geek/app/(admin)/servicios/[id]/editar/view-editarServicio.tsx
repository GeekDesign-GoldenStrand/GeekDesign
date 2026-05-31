"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ServicioForm } from "@/components/admin/servicios/organisms/ServicioForm";
import { mapServicioDetalladoToFormState } from "@/lib/utils/servicio-mappers";
import type { ServicioAdminDetalle } from "@/types/servicios";

type Props = { servicio: ServicioAdminDetalle };

export function ViewEditarServicio({ servicio }: Props) {
  const router = useRouter();
  const initialData = mapServicioDetalladoToFormState(servicio);

  const handleSuccess = () => {
    router.push("/servicios");
    router.refresh();
  };

  const handleCancel = () => {
    router.push("/servicios");
  };

  return (
    <div className="p-8">
      <Link
        href={`/servicios/${servicio.id_servicio}`}
        className="inline-flex items-center gap-2 p-2 w-fit text-[13px] shadow-sm rounded-[7px] border border-red-300 font-medium text-red-500 hover:text-red-600 transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Regresar
      </Link>
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

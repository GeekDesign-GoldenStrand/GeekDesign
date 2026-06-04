"use client";

import { WarningCircle, ArrowClockwise } from "@phosphor-icons/react";
import { useEffect } from "react";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { Button } from "@/components/ui/atoms/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if necessary
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <AdminHeader title="Dashboard" />

      <div className="max-w-2xl mx-auto mt-12">
        <div className="flex flex-col items-center justify-center min-h-[350px] p-8 md:p-12 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <WarningCircle size={32} weight="fill" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No se pudieron cargar las métricas
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Hubo un problema al intentar conectar con la base de datos para obtener los ingresos.
            Por favor, intenta de nuevo o contacta a soporte si el problema persiste.
          </p>
          <Button variant="primary" section="admin" size="md" onClick={() => reset()}>
            <ArrowClockwise size={20} />
            Reintentar carga
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { useEffect } from "react";

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
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
        <WarningCircle size={32} weight="fill" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        No se pudieron cargar las métricas en este momento
      </h2>
      <p className="text-gray-500 text-sm max-w-md mb-6">
        Hubo un problema al intentar conectar con la base de datos para obtener los ingresos. Por
        favor, intenta de nuevo o contacta a soporte si el problema persiste.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-md"
      >
        Reintentar carga
      </button>
    </div>
  );
}

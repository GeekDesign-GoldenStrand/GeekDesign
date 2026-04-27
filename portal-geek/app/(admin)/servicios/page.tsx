"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/admin/forms/atoms";

// Type of service as returned by the backend. We can adjust this as needed based 
// on the actual API response. It can be extracted from types/servicios.ts if used in multiple places.

type Servicio = {
  id_servicio: number;
  nombre_servicio: string;
  descripcion_servicio: string | null;
  estatus_servicio: boolean;
  id_estatus: number;
};

// Backend´s Answers for paginated endpoints. Adjust as needed based on actual API response structure.
type PaginatedResponse = {
  data: Servicio[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServicios() {
      try {
        const res = await fetch("/api/servicios");
        if (!res.ok) throw new Error("Error al cargar servicios");
        const json: PaginatedResponse = await res.json();
        setServicios(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    fetchServicios();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#1e1e1e]">Servicios</h1>
        <Link href="/servicios/nuevo">
          <Button variant="primary">+ Nuevo servicio</Button>
        </Link>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500">
          Cargando servicios...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {!loading && !error && servicios.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay servicios registrados todavía.
        </div>
      )}

      {!loading && !error && servicios.length > 0 && (
        <div className="bg-white rounded-md shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                  Descripción
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                  Estatus
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((servicio) => (
                <tr
                  key={servicio.id_servicio}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-[#1e1e1e]">
                    {servicio.nombre_servicio}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {servicio.descripcion_servicio ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {servicio.estatus_servicio ? (
                      <span className="inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/servicios/${servicio.id_servicio}`}
                      className="text-[#e42200] hover:underline text-sm font-medium"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
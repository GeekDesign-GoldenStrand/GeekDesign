"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { CotizacionDetailPage } from "@/components/ui/cotizaciones/templates/CotizacionDetailPage";
import type { UserRole } from "@/types";
import type { Cotizacion } from "@/types/cotizacion";

async function getCotizacion(id: string): Promise<Cotizacion> {
  const res = await fetch(`/api/cotizaciones/${id}`);
  if (!res.ok) throw new Error("Error fetching cotización");
  const json = await res.json();
  return json.data;
}

export default function CotizacionDetail({ id, userRole }: { id: string; userRole?: UserRole }) {
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const data = await getCotizacion(id);
      setCotizacion(data);
    } catch {
      setError("Hubo un error al recargar la cotización.");
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await getCotizacion(id);
        if (!cancelled) setCotizacion(data);
      } catch {
        if (!cancelled) setError("Hubo un error al cargar la cotización.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) return <p className="px-8 pt-6 text-sm">Cargando cotización...</p>;
  if (error) return <p className="px-8 pt-6 text-sm text-red-500">{error}</p>;
  if (!cotizacion) return null;

  return (
    <div>
      <AdminHeader title={`Cotización — ${cotizacion.nombre_oportunidad || "Sin nombre"}`} />
      <CotizacionDetailPage cotizacion={cotizacion} userRole={userRole} onRefetch={refetch} />
    </div>
  );
}

import { CarritoView } from "@/components/storefront/organisms/CarritoView";
import { listServicios } from "@/lib/services/servicios";

export default async function CarritoPage() {
  let relatedServices: { id_servicio: number; nombre_servicio: string }[] = [];
  try {
    const { items } = await listServicios(1, 10, true);
    relatedServices = items.map((s) => ({
      id_servicio: s.id_servicio,
      nombre_servicio: s.nombre_servicio,
    }));
  } catch {
    // fallback: empty related services if DB unavailable
  }

  return <CarritoView relatedServices={relatedServices} />;
}

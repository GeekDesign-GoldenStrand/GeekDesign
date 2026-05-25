import { ViewServicios } from "./view-servicio";

// Role/section access is enforced in layout.tsx (requireSection).
export const dynamic = "force-dynamic";

export default function ServiciosPage() {
  return <ViewServicios />;
}

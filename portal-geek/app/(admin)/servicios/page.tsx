import { AdminHeader } from "@/components/admin/organisms/AdminHeader";

import { ViewServicios } from "./view-servicio";

// Role/section access is enforced in layout.tsx (requireSection).
export const dynamic = "force-dynamic";

export default function ServiciosPage() {
  return (
    <div>
      <AdminHeader title="Servicios" />
      <ViewServicios />
    </div>
  );
}

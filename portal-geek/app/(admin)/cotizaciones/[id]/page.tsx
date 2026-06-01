import { getSession } from "@/lib/auth/session";
import type { UserRole } from "@/types";

import DetailPage from "./cotizacion-detail";

export default async function CotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Forwarded to CotizacionDetailPage so the discount affordances can be
  // role-gated client-side (PATCH .../descuento requires Direccion). The
  // server-side route still enforces the gate; this just prevents UI that
  // would 403 on save.
  const session = await getSession();
  const userRole = session?.role as UserRole | undefined;

  return (
    <div>
      <DetailPage id={id} userRole={userRole} />
    </div>
  );
}

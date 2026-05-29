import { getSession } from "@/lib/auth/session";

import DetailPage from "./cotizacion-detail";

export default async function CotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  return (
    <div>
      <DetailPage id={id} currentUserRole={session?.role ?? null} />
    </div>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/atoms/Button";
import { EmptyState } from "@/components/ui/atoms/EmptyState";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <EmptyState
        title="Página no encontrada"
        description="La URL que intentaste abrir no existe o ya no está disponible."
        action={
          <Button asChild>
            <Link href="/dashboard">Volver al inicio</Link>
          </Button>
        }
      />
    </div>
  );
}

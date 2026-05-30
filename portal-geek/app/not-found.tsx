import Link from "next/link";

import { Button } from "@/components/ui/atoms/Button";
import { EmptyState } from "@/components/ui/atoms/EmptyState";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <EmptyState
        title="Página no encontrada"
        description="La página que buscas no existe."
        action={
          <Button asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        }
      />
    </div>
  );
}

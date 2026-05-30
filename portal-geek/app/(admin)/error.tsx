"use client";

// Section-level error boundary for /(admin)/**. Catches both render-time and
// data-fetch errors. The reset() callback retries the failing route segment.

import { useEffect } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { ErrorState } from "@/components/ui/atoms/ErrorState";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("[admin error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <ErrorState
        title="No pudimos cargar esta sección"
        description="Algo falló al obtener la información. Si el problema persiste, contacta al administrador."
        onRetry={reset}
        action={
          <Button variant="secondary" size="sm" asChild>
            <a href="/dashboard">Volver al inicio</a>
          </Button>
        }
      />
    </div>
  );
}

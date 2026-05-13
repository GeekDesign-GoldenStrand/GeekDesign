import { pdf } from "@react-pdf/renderer";
import { useState } from "react";
import React from "react";

import { WorkOrderDocument } from "@/components/storefront/organisms/WorkOrderDocument";
import type { QuotationFullContext, QuotationItem } from "@/types";

export function useWorkOrder() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async (quotationId: string, services: QuotationItem[], status: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      // 1. Status Validation (Best Practice)
      if (status === "en_revision") {
        throw new Error(
          "No se puede generar la orden de trabajo mientras la cotización está en revisión."
        );
      }

      // 2. Data context simulation (Data Layer)
      // In a real app, this would come from an API performing SQL Joins
      const fullContext: QuotationFullContext = {
        id: quotationId,
        fecha_validacion: new Date().toLocaleDateString("es-MX", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        currency: "MXN",
        sucursal: {
          nombre: "GeekDesign Principal",
          direccion: "Av. de la Tecnología 404",
          colonia: "Parque Industrial",
          municipio: "Querétaro",
          estado: "Querétaro",
          cp: "76000",
        },
        contacto_direccion: {
          nombre: "Andrea Hernández",
          email: "direccion@geekdesign.mx",
          telefono: "+52 442 123 4567",
        },
        servicios: services,
        resumen: {
          subtotal: services.reduce((acc, s) => acc + (s.precio_nuevo || s.precio_anterior), 0),
          iva: services.reduce((acc, s) => acc + (s.precio_nuevo || s.precio_anterior), 0) * 0.16,
          total: services.reduce((acc, s) => acc + (s.precio_nuevo || s.precio_anterior), 0) * 1.16,
        },
        terminos:
          "Esta cotización tiene una vigencia de 15 días naturales. El tiempo de entrega comienza a contar a partir de la recepción del anticipo del 50% y la aprobación final del diseño. No se aceptan cancelaciones una vez iniciado el proceso de producción. Los precios incluyen IVA.",
      };

      // 3. Asynchronous PDF rendering
      const doc = React.createElement(WorkOrderDocument, { data: fullContext });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(doc as any).toBlob();

      // 4. Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Orden_Trabajo_${quotationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (err: unknown) {
      console.error("PDF Generation Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Ocurrió un error inesperado al generar el PDF.";
      setError(errorMessage);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    isGenerating,
    error,
  };
}

import { notFound } from "next/navigation";

import { QuotationDetailView } from "@/components/storefront/organisms/QuotationDetailView";
import { getCotizacion, getCotizacionByFolio } from "@/lib/services/cotizaciones";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CotizacionDetallePage({ params }: Props) {
  const { id } = await params;

  // Try lookup by Folio (primary) or ID (fallback)
  let quote = await getCotizacionByFolio(id);

  if (!quote && /^\d+$/.test(id)) {
    quote = await getCotizacion(Number(id));
  }

  if (!quote) {
    notFound();
  }

  // Map backend data to frontend component format
  const mappedQuotation = {
    id_cotizacion: quote.id_cotizacion,
    folio: quote.folio,
    monto_total: Number(quote.monto_total),
    fecha_creacion: quote.fecha_creacion.toISOString(),
    notas: quote.notas,
    estatus: quote.estatus.descripcion,
    cliente: {
      nombre_cliente: quote.cliente.nombre_cliente,
      empresa: quote.cliente.empresa,
    },
    items:
      quote.pedido?.detalles && quote.pedido.detalles.length > 0
        ? quote.pedido.detalles.map((d) => {
            const notas = d.notas || "";
            const estadoMatch = notas.match(/\[ESTADO:(.*?)\]/);
            const antesMatch = notas.match(/\[ANTES:(.*?)\]/);
            const precioAnterior = antesMatch
              ? Number(antesMatch[1])
              : Number(d.precio_unitario) * d.cantidad;
            const currentTotal = Number(d.precio_unitario) * d.cantidad;
            const isActuallyModified =
              estadoMatch &&
              estadoMatch[1].toLowerCase() === "modificado" &&
              precioAnterior !== currentTotal;

            return {
              id: d.id_detalle,
              nombre: d.servicio.nombre_servicio,
              cantidad: d.cantidad,
              precio_unitario: Number(d.precio_unitario),
              precio_total: currentTotal,
              precio_anterior: precioAnterior,
              estado: isActuallyModified
                ? "modificado"
                : estadoMatch
                  ? estadoMatch[1].toLowerCase() === "modificado"
                    ? "sin_cambios"
                    : estadoMatch[1].toLowerCase()
                  : "sin_cambios",
              descripcion: d.servicio.descripcion_servicio || "Servicio solicitado",
            };
          })
        : quote.variablesCotizacion.map((v) => {
            const precio = Number(v.valor);
            return {
              id: v.id_valor,
              nombre: v.formula.servicio.nombre_servicio,
              cantidad: 1,
              precio_unitario: precio,
              precio_total: precio,
              precio_anterior: precio,
              estado: "sin_cambios",
              descripcion: v.formula.servicio.descripcion_servicio || "Servicio solicitado",
            };
          }),
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <QuotationDetailView quotation={mappedQuotation} />
    </div>
  );
}

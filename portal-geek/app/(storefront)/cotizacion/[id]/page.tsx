import { WarningCircle, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { QuotationDetailView } from "@/components/storefront/organisms/QuotationDetailView";
import { getCotizacion, getCotizacionByFolio } from "@/lib/services/cotizaciones";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function CotizacionDetallePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { email: providedEmail } = await searchParams;

  // Try lookup by Folio (primary) or ID (fallback)
  let quote = await getCotizacionByFolio(id);

  if (!quote && /^\d+$/.test(id)) {
    quote = await getCotizacion(Number(id));
  }

  // Security Verification requires Email + Folio for public access.
  // We use a generic message for both "Not Found" and "Email Mismatch" to prevent
  // enumeration and information leakage.
  const clientEmail = quote?.cliente.correo_electronico.toLowerCase();
  const isVerified = quote && providedEmail?.toLowerCase() === clientEmail;

  if (!isVerified || !quote) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-[500px] w-full bg-white rounded-[24px] border border-[#E8E8E8] p-10 text-center shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
          <div className="w-20 h-20 rounded-full bg-[#FFF1F1] flex items-center justify-center text-[#DF2646] mx-auto mb-8">
            <WarningCircle size={44} weight="bold" />
          </div>
          <h2 className="text-[28px] font-black text-[#1e1e1e] mb-4">Datos incorrectos</h2>
          <p className="text-[#575757] text-[18px] font-medium leading-relaxed mb-10">
            Los datos ingresados no son coincidentes. Por favor, verifica tus datos e intenta de
            nuevo.
          </p>
          <Link
            href="/storefront"
            className="inline-flex items-center justify-center gap-3 h-[64px] px-8 bg-[#DF2646] text-white rounded-[12px] font-bold text-[16px] hover:bg-[#C41E3A] transition-all shadow-lg shadow-[#DF2646]/20"
          >
            <MagnifyingGlass size={22} weight="bold" />
            Volver a buscar
          </Link>
        </div>
      </div>
    );
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

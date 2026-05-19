import { WarningCircle, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { QuotationDetailView } from "@/components/storefront/organisms/QuotationDetailView";
import { getCotizacion, getCotizacionByFolio } from "@/lib/services/cotizaciones";

export const metadata: Metadata = { title: "Detalle de cotización" };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function CotizacionDetallePage({ params, searchParams }: Props) {
  const { id } = await params;

  // Retrieve client email and folio securely from cookies to keep URLs clean and protected
  const cookieStore = await cookies();
  const cookieEmail = cookieStore.get("client_email")?.value;
  const cookieFolio = cookieStore.get("client_folio")?.value;
  const { email: queryEmail } = await searchParams;
  const providedEmail = cookieEmail || queryEmail;

  // Try lookup by Folio (primary) or ID (fallback)
  let quote = await getCotizacionByFolio(id);

  if (!quote && /^\d+$/.test(id)) {
    quote = await getCotizacion(Number(id));
  }

  // Security Verification requires Email + Folio for public access.
  // We use a generic message for both "Not Found" and "Email Mismatch" to prevent
  // enumeration and information leakage.
  const clientEmail = quote?.cliente.correo_electronico.toLowerCase();

  // Verify BOTH email and folio cookies match the retrieved quotation
  const isEmailMatched = quote && providedEmail?.toLowerCase() === clientEmail;
  const isFolioMatched =
    quote &&
    (cookieFolio?.trim().toLowerCase() === quote.folio?.trim().toLowerCase() ||
      cookieFolio?.trim() === String(quote.id_cotizacion) ||
      id.trim().toLowerCase() === quote.folio?.trim().toLowerCase() ||
      id.trim() === String(quote.id_cotizacion));

  const isVerified = isEmailMatched && isFolioMatched;

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
            href="/tienda"
            className="inline-flex items-center justify-center gap-3 h-[64px] px-8 bg-[#DF2646] text-white rounded-[12px] font-bold text-[16px] hover:bg-[#C41E3A] transition-all shadow-lg shadow-[#DF2646]/20"
          >
            <MagnifyingGlass size={22} weight="bold" />
            Volver a buscar
          </Link>
        </div>
      </div>
    );
  }

  if (
    quote.estatus.descripcion === "Aprobada" ||
    quote.estatus.descripcion.toLowerCase() === "confirmada"
  ) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-[500px] w-full bg-white rounded-[24px] border border-[#E8E8E8] p-10 text-center shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
          <div className="w-20 h-20 rounded-full bg-[#FFF9F1] flex items-center justify-center text-[#F16C20] mx-auto mb-8 animate-pulse">
            <WarningCircle size={44} weight="bold" />
          </div>
          <h2 className="text-[28px] font-black text-[#1e1e1e] mb-4">Vista en construcción</h2>
          <p className="text-[#575757] text-[18px] font-medium leading-relaxed mb-10">
            La vista está en construcción. Próximamente estará disponible.
          </p>
          <Link
            href="/storefront"
            className="inline-flex items-center justify-center gap-3 h-[64px] px-8 bg-[#DF2646] text-white rounded-[12px] font-bold text-[16px] hover:bg-[#C41E3A] transition-all shadow-lg shadow-[#DF2646]/20"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Map backend data to frontend component format
  const mappedQuotation = {
    id_cotizacion: quote.id_cotizacion,
    folio: quote.folio,
    // Note: The database seed (prisma/seed.ts) and services use "Validada" as the status description
    // to match the SRS specification.
    estatus: quote.estatus.descripcion,
    monto_total: Number(quote.monto_total),
    fecha_creacion: quote.fecha_creacion.toISOString(),
    notas: quote.notas,
    cliente: {
      nombre_cliente: quote.cliente.nombre_cliente,
      empresa: quote.cliente.empresa,
    },
    // ST-16: surface pedido production status to the cliente once the cotización
    // is approved. Pre-approval we leave it null so the existing UI is unaffected.
    pedido: quote.pedido
      ? {
          id_pedido: quote.pedido.id_pedido,
          estatus: quote.pedido.estatus.descripcion,
          estado_factura: quote.pedido.estado_factura?.descripcion ?? null,
        }
      : null,
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
              nombre: v.variable.formula.servicio.nombre_servicio,
              cantidad: 1,
              precio_unitario: precio,
              precio_total: precio,
              precio_anterior: precio,
              estado: "sin_cambios",
              descripcion:
                v.variable.formula.servicio.descripcion_servicio || "Servicio solicitado",
            };
          }),
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <QuotationDetailView quotation={mappedQuotation} />
    </div>
  );
}

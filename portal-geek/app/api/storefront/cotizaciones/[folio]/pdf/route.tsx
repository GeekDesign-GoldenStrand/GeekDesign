// ST-19 — Customer downloads a PDF of their approved cotización from the
// storefront tracker. Cookie-based auth (cotizacion_session JWT minted by the
// magic-link consume handler); no admin role needed.
//
// Response shape:
//   200 application/pdf   — Content-Disposition: attachment; filename="<folio>.pdf"
//   307 /tienda/cotizacion?estado=acceso-requerido
//                         — no session, wrong session, or folio doesn't exist
//                           (single anti-enumeration branch)
//   409                   — cotización exists for this session but is not yet Aprobada
//
// Re-uses the existing WorkOrderTemplate that was built for this story but
// never wired to a route.
import { renderToBuffer } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import React from "react";

import { WorkOrderTemplate } from "@/components/pdf/templates/WorkOrderTemplate";
import { prisma } from "@/lib/db/client";
import { readSessionCotizacionId, SESSION_COOKIE_NAME } from "@/lib/services/cotizacion-access";
import { apiError } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { folio: string };

// Anti-enumeration: any failure mode other than "wrong status" lands here.
// We don't differentiate between "no cookie", "cookie for different cotización",
// and "folio doesn't exist" — they're indistinguishable to the cliente.
function accesoRequerido(req: NextRequest): NextResponse {
  const fallback = new URL("/tienda/cotizacion", req.url);
  fallback.searchParams.set("estado", "acceso-requerido");
  return NextResponse.redirect(fallback);
}

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { folio } = await ctx.params;

    const jwt = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const sessionCotId = jwt ? await readSessionCotizacionId(jwt) : null;
    if (!sessionCotId) return accesoRequerido(req);

    // Load with everything the template needs: cliente, estatus, sucursal
    // (lives on Pedidos), and each detalle's servicio + material + archivo.
    const quote = await prisma.cotizaciones.findUnique({
      where: { folio },
      include: {
        cliente: true,
        estatus: true,
        pedido: {
          include: {
            sucursal: true,
            detalles: {
              include: { servicio: true, material: true, archivo: true },
            },
          },
        },
      },
    });

    if (!quote || quote.id_cotizacion !== sessionCotId) {
      return accesoRequerido(req);
    }

    if (quote.estatus.descripcion !== "Aprobada") {
      return apiError("El PDF está disponible una vez que la cotización es Aprobada", 409);
    }

    // Map Prisma payload → WorkOrderTemplate context. The template tolerates
    // missing optional fields, but its specs need at least servicio + material.
    const context = {
      quotation: {
        id_cotizacion: quote.id_cotizacion,
        folio: quote.folio,
        monto_total: Number(quote.monto_total),
        fecha_creacion: quote.fecha_creacion,
        fecha_validacion: quote.fecha_validacion,
        fecha_aprobacion: quote.fecha_aprobacion,
      },
      client: {
        nombre_cliente: quote.cliente.nombre_cliente,
        empresa: quote.cliente.empresa,
        correo_electronico: quote.cliente.correo_electronico,
        numero_telefono: quote.cliente.numero_telefono,
      },
      specs: (quote.pedido?.detalles ?? []).map((d) => ({
        servicio: d.servicio ? { nombre_servicio: d.servicio.nombre_servicio } : null,
        material: d.material ? { nombre_material: d.material.nombre_material } : null,
        archivo: d.archivo ? { url_archivo: d.archivo.url_archivo } : null,
        notas: d.notas,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
      })),
      branch: {
        nombre_sucursal: quote.pedido?.sucursal?.nombre_sucursal ?? "Geek Design",
        direccion:
          quote.pedido?.sucursal?.direccion ??
          "Av. Mediterráneo 236 B Fracc. Pirámides, Villa Corregidora, Querétaro",
      },
    };

    const buffer = await renderToBuffer(<WorkOrderTemplate context={context} />);

    // Sanitize the filename: the folio is server-generated today (GD-YYYY-NNNNN)
    // and can't contain quotes or CR/LF, but the DB column has no format
    // constraint. Whitelist [A-Za-z0-9._-] so a future folio shape change
    // can't inject header bytes (CWE-93).
    const safeName = (quote.folio ?? `cotizacion-${quote.id_cotizacion}`).replace(
      /[^A-Za-z0-9._-]/g,
      "_"
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}

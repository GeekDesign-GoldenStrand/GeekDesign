import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db/client";
import {
  consumeAccessToken,
  signSessionJWT,
  signClienteJWT,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
  CLIENTE_COOKIE_NAME,
  CLIENTE_COOKIE_MAX_AGE,
} from "@/lib/services/cotizacion-access";

// KIKW12 review #1b/#2: magic-link consume endpoint.
// Cliente clicks the link in their email -> we verify the token, mint a session
// cookie scoped to this cotización, and redirect to the tracker page.
//
// On any failure we redirect to the lookup page (not a JSON error) so the email
// link UX always lands somewhere usable.
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const fallbackUrl = new URL("/tienda/cotizacion", appUrl);
  fallbackUrl.searchParams.set("estado", "enlace-invalido");

  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(fallbackUrl);
  }

  let id_cotizacion: number;
  try {
    id_cotizacion = await consumeAccessToken(token);
  } catch {
    return NextResponse.redirect(fallbackUrl);
  }

  // Resolve folio (for redirect) and the owning cliente (to refresh the
  // long-lived "recognized client" cookie used for checkout prefill).
  const cot = await prisma.cotizaciones.findUnique({
    where: { id_cotizacion },
    select: { folio: true, id_cliente: true },
  });
  if (!cot?.folio) {
    return NextResponse.redirect(fallbackUrl);
  }

  const jwt = await signSessionJWT(id_cotizacion);
  const response = NextResponse.redirect(new URL(`/tienda/cotizacion/${cot.folio}`, appUrl));
  response.cookies.set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  // The client just proved email control — set/refresh the recognized-client
  // cookie so their next checkout prefills. Rolling the 90-day TTL on every
  // link click keeps an active client recognized indefinitely.
  const id_cliente = cot.id_cliente;
  if (typeof id_cliente === "number") {
    const clienteJwt = await signClienteJWT(id_cliente);
    response.cookies.set(CLIENTE_COOKIE_NAME, clienteJwt, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CLIENTE_COOKIE_MAX_AGE,
    });
  }
  return response;
}

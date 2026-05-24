import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { sectionForPath, can } from "@/lib/auth/access";
import type { Role } from "@/lib/auth/access";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { verifyToken } from "@/lib/auth/tokens";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev-time bypass: no auth secret configured yet → let every request through.
  if (!process.env.AUTH_SECRET) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifyToken(token) : null;

  // Already logged in → skip the login page.
  if (pathname.startsWith("/login")) {
    if (claims) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  // Everything past here is an admin path (see config.matcher): require a session.
  if (!claims) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Coarse, edge-level gate. verifyToken has already normalized the legacy
  // "Administrador" alias to "Direccion", so claims.rol is a canonical Role.
  // Section-less admin paths (/dashboard, /perfil) only need a valid session;
  // the real per-section enforcement lives in the layouts/pages (Phase 3).
  const section = sectionForPath(pathname);
  if (section && !can(claims.rol as Role, section, "read")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  if (process.env.SKIP_AUTH === "true" || process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }
  return proxy(request);
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/pedidos/:path*",
    "/cotizaciones/:path*",
    "/clientes/:path*",
    "/colaboradores/:path*",
    "/sucursales/:path*",
    "/materiales/:path*",
    "/maquinas/:path*",
    "/terceros/:path*",
    "/usuarios/:path*",
    "/finanzas/:path*",
    "/metricas/:path*",
  ],
};

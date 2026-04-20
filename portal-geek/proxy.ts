import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { verifyToken } from "@/lib/auth/tokens";
import type { UserRole } from "@/types";

const ADMIN_ROLES: UserRole[] = ["Direccion", "Administrador", "Colaborador", "Finanzas"];

const ADMIN_PATHS = [
  "/dashboard",
  "/pedidos",
  "/cotizaciones",
  "/clientes",
  "/colaboradores",
  "/sucursales",
  "/materiales",
  "/maquinas",
  "/terceros",
  "/servicios",
  "/usuarios",
  "/finanzas",
  "/metricas",
];

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

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath) {
    if (!claims) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!ADMIN_ROLES.includes(claims.rol)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  if (process.env.SKIP_AUTH === "true" || process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }
  return _authMiddleware(request);
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
    "/servicios/:path*",
    "/usuarios/:path*",
    "/finanzas/:path*",
    "/metricas/:path*",
  ],
};

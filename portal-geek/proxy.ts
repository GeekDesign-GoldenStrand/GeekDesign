import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth/auth0";

const ROLES_CLAIM = "https://geekdesign.mx/roles";
const ADMIN_ROLES = ["Direccion", "Administrador", "Colaborador", "Finanzas"];

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
  // Let Auth0 handle its own routes (callback, logout, etc.)
  const authResponse = await auth0.middleware(request);

  const { pathname } = request.nextUrl;
  const session = await auth0.getSession(request);

  if (pathname.startsWith("/login")) {
    if (session) return NextResponse.redirect(new URL("/dashboard", request.url));
    return authResponse;
  }

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const roles: string[] = session.user[ROLES_CLAIM] ?? [];
    const hasAdminRole = roles.some((r) => ADMIN_ROLES.includes(r));
    if (!hasAdminRole) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return authResponse;
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
    // Required for Auth0 SDK to handle its own routes
    "/auth/:path*",
  ],
};

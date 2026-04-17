import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "gd_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const ADMIN_ROLES = ["Direccion", "Administrador", "Colaborador", "Finanzas"];

async function getSessionRole(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth routes — redirect to dashboard if already logged in
  if (pathname.startsWith("/login")) {
    const role = await getSessionRole(request);
    if (role) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  // Admin portal — requires internal role
  if (pathname.startsWith("/dashboard") || pathname.match(/^\/(pedidos|cotizaciones|clientes|colaboradores|sucursales|materiales|maquinas|proveedores|instaladores|servicios|usuarios|finanzas|metricas)/)) {
    const role = await getSessionRole(request);
    if (!role) return NextResponse.redirect(new URL("/login", request.url));
    if (!ADMIN_ROLES.includes(role)) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
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
    "/proveedores/:path*",
    "/instaladores/:path*",
    "/servicios/:path*",
    "/usuarios/:path*",
    "/finanzas/:path*",
    "/metricas/:path*",
  ],
};

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { sectionForPath, can, landingPath } from "@/lib/auth/access";
import type { Role } from "@/lib/auth/access";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { verifyToken } from "@/lib/auth/tokens";

// Hard cap on any JSON/form payload we accept. Real uploads (designs) go
// browser → GCS directly via presigned URL, so /api/* never legitimately sees
// anything close to this. Without the cap a single oversize POST can OOM the
// dev server during a demo.
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB

function rejectIfOversize(request: NextRequest): NextResponse | null {
  const lenHeader = request.headers.get("content-length");
  if (!lenHeader) return null;
  const len = Number(lenHeader);
  if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
    return NextResponse.json({ data: null, error: "Payload demasiado grande" }, { status: 413 });
  }
  return null;
}

export async function proxy(request: NextRequest) {
  // Body-size cap runs first so a 100 MB POST can't reach the server regardless
  // of NODE_ENV / SKIP_AUTH. The matcher includes /api/:path* only so this
  // check can fire for API routes too.
  const oversize = rejectIfOversize(request);
  if (oversize) return oversize;

  // Dev shortcut: in `next dev` (NODE_ENV=development) or when SKIP_AUTH=true,
  // let every request through without touching session cookies.
  if (process.env.SKIP_AUTH === "true" || process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // /api/* routes have their own auth guards (withAuth/withRole/withSection)
  // and must not get redirected to /login by the page-level proxy.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Dev-time bypass: no auth secret configured yet → let every request through.
  if (!process.env.AUTH_SECRET) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifyToken(token) : null;

  // Already logged in → skip the login page.
  if (pathname.startsWith("/login")) {
    if (claims) return NextResponse.redirect(new URL(landingPath(claims.rol as Role), request.url));
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
    // Send the user straight to their own landing section in a single hop,
    // rather than bouncing through /dashboard (which non-Direccion roles can't
    // read and would just re-redirect via the page guard).
    return NextResponse.redirect(new URL(landingPath(claims.rol as Role), request.url));
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
    "/terceros/:path*",
    "/usuarios/:path*",
    "/finanzas/:path*",
    "/metricas/:path*",
    "/api/:path*",
  ],
};

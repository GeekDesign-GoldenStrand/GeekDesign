import { NextResponse, type NextRequest } from "next/server";

import { presignGet, publicUrl } from "@/lib/services/storage";
import { isValidKey } from "@/lib/storage/keys";

// Categories the storefront is allowed to expose anonymously. Everything
// else (disenios = client IP, notas = client-private, cotizaciones =
// financial docs) requires the authenticated portal path.
const PUBLIC_CATEGORIES = new Set(["materiales", "servicios"]);

// Cache the redirect just under the presigned URL's 5-minute lifetime so
// the browser never holds a 302 that points at an expired signature.
const REDIRECT_MAX_AGE_SECONDS = 4 * 60;

// GET /api/images/<category>/<yyyy>/<mm>/<uuid>.<ext>
//
// Public, unauthenticated. The route is the stable URL the storefront
// embeds in <img>; each request resolves to a fresh presigned (or public)
// GCS URL via a 302. This lets us keep the bucket private while still
// serving the catalog from cacheable HTML.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ key: string[] }> }
): Promise<Response> {
  const { key: segments } = await ctx.params;
  const key = segments.join("/");

  if (!isValidKey(key)) {
    return NextResponse.json({ data: null, error: "Clave inválida." }, { status: 422 });
  }

  const category = key.split("/")[0];
  if (!PUBLIC_CATEGORIES.has(category)) {
    return NextResponse.json({ data: null, error: "Recurso no disponible." }, { status: 404 });
  }

  const target = publicUrl(key) ?? (await presignGet(key));
  return NextResponse.redirect(target, {
    status: 302,
    headers: { "Cache-Control": `public, max-age=${REDIRECT_MAX_AGE_SECONDS}` },
  });
}

import { NextResponse } from "next/server";

// ─── TODO: ADMIN-04 / ADMIN-05 ────────────────────────────────────────────────
//
// This endpoint will replace the client-side calcularPrecioUnitario() call in
// AddToCartForm once the formula system (ADMIN-04/05) is implemented.
//
// Migration steps when the formula system is ready:
//   1. Implement this handler — evaluate the service formula server-side using
//      the registered variables/constants and the client's selections + quantity.
//   2. In AddToCartForm.tsx:
//      a. Remove the `matriz` field from the Valor interface and Props.
//      b. Replace the calcularPrecioUnitario() call with a debounced fetch
//         to POST /api/servicios/[id]/calcular-precio (suggested debounce: 150ms).
//      c. Remove the import of calcularPrecioUnitario from lib/cart/storage.
//   3. In app/(storefront)/servicios/[id]/page.tsx:
//      a. Remove the `matriz` mapping inside the opciones prop passed to AddToCartForm.
//      b. The SSR fetch (getServicioWithDetails) can stop including the matriz relation.
//
// Expected request body:
//   { selecciones: { opcionId: number; valorId: number }[]; cantidad: number }
//
// Expected response:
//   { precioUnitario: number }
// ──────────────────────────────────────────────────────────────────────────────

export async function POST() {
  return NextResponse.json(
    { message: "Not implemented — pending ADMIN-04/05 formula system" },
    { status: 501 }
  );
}

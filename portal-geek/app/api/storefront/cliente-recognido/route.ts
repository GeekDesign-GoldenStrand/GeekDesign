import { NextResponse } from "next/server";

import { CLIENTE_COOKIE_NAME } from "@/lib/services/cotizacion-access";

// Drop the "recognized client" cookie so the checkout form stops prefilling.
// Used by the "¿No eres tú?" action — e.g. on a shared computer.
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CLIENTE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

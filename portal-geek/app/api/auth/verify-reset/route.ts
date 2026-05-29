import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  // Behind App Engine's proxy, request.url resolves to the internal
  // origin (e.g. http://localhost:8081), so prefer the public app URL.
  const base = process.env.NEXT_PUBLIC_APP_URL ?? request.url;
  const redirectUrl = new URL("/establecer-contrasena", base);
  const response = NextResponse.redirect(redirectUrl);

  if (token) {
    // Set the token in an HttpOnly cookie
    response.cookies.set("reset_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Must be lax or none so it works when clicking from an email client
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours to match token TTL
    });
  }

  return response;
}

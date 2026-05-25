import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  // Redirect to the collaborator password setting page
  const redirectUrl = new URL("/establecer-contrasena", request.url);
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

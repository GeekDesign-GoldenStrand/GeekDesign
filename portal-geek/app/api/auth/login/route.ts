import { NextResponse } from "next/server";

// Step 1 — Redirect the user to the OAuth provider's authorization URL.
// The provider will redirect back to /api/auth/callback after the user authenticates.
export function GET() {
  const params = new URLSearchParams({
    client_id: process.env.OAUTH_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    response_type: "code",
    scope: process.env.OAUTH_SCOPE ?? "openid email profile",
    state: crypto.randomUUID(), // CSRF protection
  });

  return NextResponse.redirect(`${process.env.OAUTH_AUTHORIZATION_URL}?${params}`);
}

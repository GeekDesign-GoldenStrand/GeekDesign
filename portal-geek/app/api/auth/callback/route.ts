import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/client";
import { createSession } from "@/lib/auth/session";
import type { UserRole } from "@/types";

// Step 2 — OAuth provider redirects here with ?code=...
// Exchange the code for an access token, fetch the user's profile,
// verify they exist in our Usuarios table, and create a session.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  // Exchange authorization code for access token
  const tokenResponse = await fetch(process.env.OAUTH_TOKEN_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      client_id: process.env.OAUTH_CLIENT_ID!,
      client_secret: process.env.OAUTH_CLIENT_SECRET!,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/login?error=token_exchange", request.url));
  }

  const { access_token } = await tokenResponse.json();

  // Fetch user profile from the provider
  const profileResponse = await fetch(process.env.OAUTH_USERINFO_URL!, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!profileResponse.ok) {
    return NextResponse.redirect(new URL("/login?error=profile_fetch", request.url));
  }

  const profile = await profileResponse.json();
  const email: string = profile.email;

  // Look up the user in our own Usuarios table
  const dbUser = await prisma.usuarios.findUnique({
    where: { correo_electronico: email },
    select: {
      id_usuario: true,
      estatus: true,
      rol: { select: { nombre_rol: true } },
    },
  });

  if (!dbUser || dbUser.estatus !== "Activo") {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  await createSession({
    id: dbUser.id_usuario,
    email,
    role: dbUser.rol.nombre_rol as UserRole,
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}

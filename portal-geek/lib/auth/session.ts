import { cookies } from "next/headers";

import { verifyToken } from "@/lib/auth/tokens";
import type { UserRole } from "@/types";

export const SESSION_COOKIE = "gd_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export interface SessionPayload {
  id: number;
  email: string;
  role: UserRole;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifyToken(token);
  if (!claims) return null;

  return { id: claims.id, email: claims.email, role: claims.rol };
}

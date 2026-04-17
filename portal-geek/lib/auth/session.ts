import { auth0 } from "@/lib/auth/auth0";
import type { UserRole } from "@/types";

// Roles are injected into the Auth0 token via a Post Login Action.
// The Action must set: api.idToken.setCustomClaim("https://geekdesign.mx/roles", event.authorization.roles)
const ROLES_CLAIM = "https://geekdesign.mx/roles";

export interface SessionPayload {
  id: string;
  email: string;
  role: UserRole | null;
}

export async function getSession(): Promise<SessionPayload | null> {
  const session = await auth0.getSession();
  if (!session) return null;

  const roles: string[] = session.user[ROLES_CLAIM] ?? [];

  return {
    id: session.user.sub,
    email: session.user.email ?? "",
    role: (roles[0] as UserRole) ?? null,
  };
}

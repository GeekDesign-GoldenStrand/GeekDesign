import { redirect } from "next/navigation";

import { can } from "@/lib/auth/access";
import type { Role, Section } from "@/lib/auth/access";
import { getSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/session";

// Server-side guard for admin pages/layouts: ensures the current session may
// *read* the given section, otherwise redirects. This is the enforcement layer
// that still holds in development, where the edge proxy is bypassed
// (SKIP_AUTH / NODE_ENV). Returns the session so callers can read role/id.
//
// verifyToken has already normalized the legacy "Administrador" alias, so
// session.role is a canonical Role.
export async function requireSection(section: Section): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.role as Role, section, "read")) redirect("/dashboard");
  return session;
}

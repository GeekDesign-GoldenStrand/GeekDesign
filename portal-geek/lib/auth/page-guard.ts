import { redirect } from "next/navigation";

import { can, landingPath } from "@/lib/auth/access";
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

// Within-section refinement: gate a single page to a specific role set when
// the section as a whole is broader. Use for SRS rules that don't fit the
// SECTION_ACCESS matrix at section granularity — e.g. PE-05 (pedidos detail
// view is Dirección-only even though pedidos.read includes Colaborador and
// Finanzas). Redirects denied users to their own landing page rather than
// /dashboard so the bounce is one hop, not two.
export async function requireRoles(roles: readonly Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = session.role as Role;
  if (!roles.includes(role)) redirect(landingPath(role));
  return session;
}

import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

import { SECTION_ACCESS, normalizeRole } from "@/lib/auth/access";
import type { Section, Action } from "@/lib/auth/access";
import { getSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/session";
import { handleError, UnauthorizedError, ForbiddenError } from "@/lib/utils/errors";
import type { UserRole } from "@/types";

// Handler that receives an authenticated session.
type Handler = (req: NextRequest, session: SessionPayload) => Promise<NextResponse>;

// Handler for routes that also need dynamic params.
type ParamHandler<P> = (
  req: NextRequest,
  ctx: { params: Promise<P> },
  session: SessionPayload
) => Promise<NextResponse>;

// Reads the current session and checks role access when needed.
//
// The role must be explicitly listed — there is no implicit widening (a route
// that allows "Direccion" does NOT silently allow anything else). The legacy
// "Administrador" alias is canonicalized to "Direccion" first; verifyToken
// already does this for real sessions, so this is belt-and-suspenders.
async function resolveSession(roles?: UserRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  if (roles && roles.length > 0) {
    if (!roles.includes(normalizeRole(session.role))) throw new ForbiddenError();
  }
  return session;
}

// Protects a route so only logged-in users can reach the handler.
export function withAuth(handler: Handler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const session = await resolveSession();
      return await handler(req, session);
    } catch (err) {
      return handleError(err);
    }
  };
}

// Protects a route and limits it to specific roles.
export function withRole(roles: UserRole[], handler: Handler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const session = await resolveSession(roles);
      return await handler(req, session);
    } catch (err) {
      return handleError(err);
    }
  };
}

// Same as withAuth, but forwards route params too.
export function withAuthParams<P>(handler: ParamHandler<P>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }): Promise<NextResponse> => {
    try {
      const session = await resolveSession();
      return await handler(req, ctx, session);
    } catch (err) {
      return handleError(err);
    }
  };
}

// Same as withRole, but forwards route params too.
export function withRoleParams<P>(roles: UserRole[], handler: ParamHandler<P>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }): Promise<NextResponse> => {
    try {
      const session = await resolveSession(roles);
      return await handler(req, ctx, session);
    } catch (err) {
      return handleError(err);
    }
  };
}

// Policy-derived guards: instead of hardcoding a role list per route, declare
// the section and action and let SECTION_ACCESS decide who is allowed. GET uses
// "read"; mutations use "write". This keeps every layer in sync with the policy.
export function withSection(section: Section, action: Action, handler: Handler) {
  return withRole(SECTION_ACCESS[section][action] as UserRole[], handler);
}

export function withSectionParams<P>(section: Section, action: Action, handler: ParamHandler<P>) {
  return withRoleParams<P>(SECTION_ACCESS[section][action] as UserRole[], handler);
}

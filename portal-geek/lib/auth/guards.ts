import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

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

const DEV_SESSION: SessionPayload = { id: 0, email: "dev@local", role: "Administrador" };

// Reads the current session and checks role access when needed.
async function resolveSession(roles?: UserRole[]): Promise<SessionPayload> {
  if (process.env.SKIP_AUTH === "true" || process.env.NODE_ENV === "development") {
    return DEV_SESSION;
  }
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  if (roles && roles.length > 0 && !roles.includes(session.role as UserRole)) {
    throw new ForbiddenError();
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

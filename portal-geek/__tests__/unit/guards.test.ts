/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withRole } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";

jest.mock("@/lib/auth/session", () => ({ getSession: jest.fn() }));
const mockGetSession = getSession as jest.Mock;

const handler = jest.fn(async () => NextResponse.json({ ok: true }));

// Invoke a withRole-wrapped route with a given session role (or null = anon).
async function call(roles: string[], role: string | null) {
  mockGetSession.mockResolvedValue(role ? { id: 1, email: "u@x.mx", role } : null);
  const route = withRole(roles as never, handler);
  const res = await route({} as unknown as NextRequest);
  return res.status;
}

// V-02: withRole used to union an ADMIN_ROLES list, so listing "Direccion"
// silently also granted "Administrador" — an implicit privilege widening. The
// fix makes the match explicit (with Administrador canonicalized to Direccion).
describe("withRole — explicit role match (V-02 regression)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allows a role that is explicitly listed", async () => {
    expect(await call(["Direccion"], "Direccion")).toBe(200);
  });

  it("treats the legacy Administrador as Direccion (alias still works)", async () => {
    expect(await call(["Direccion"], "Administrador")).toBe(200);
  });

  it("denies a role that is not listed", async () => {
    expect(await call(["Direccion"], "Colaborador")).toBe(403);
    expect(await call(["Direccion"], "Finanzas")).toBe(403);
  });

  it("does NOT auto-grant Direccion/Administrador on another role's route (no admin union)", async () => {
    expect(await call(["Finanzas"], "Direccion")).toBe(403);
    expect(await call(["Finanzas"], "Administrador")).toBe(403);
    expect(await call(["Finanzas"], "Finanzas")).toBe(200);
  });

  it("returns 401 when there is no session", async () => {
    expect(await call(["Direccion"], null)).toBe(401);
  });
});

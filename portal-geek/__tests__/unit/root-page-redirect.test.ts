/**
 * @jest-environment node
 *
 * Root `/` page (app/page.tsx) routes by session:
 *   - logged in  → landingPath(normalizeRole(role))
 *   - anonymous  → /tienda
 *
 * Before this PR, every visit to `/` dumped users on `/tienda`, including
 * logged-in staff who should have landed on their work area. These tests
 * lock in the new behavior so a future change can't silently re-break it.
 */

import type { SessionPayload } from "@/lib/auth/session";
import type { UserRole } from "@/types";

const getSessionMock = jest.fn<Promise<SessionPayload | null>, []>();
const redirectMock = jest.fn((path: string) => {
  throw new Error(`__REDIRECT__:${path}`);
});

jest.mock("@/lib/auth/session", () => ({
  getSession: () => getSessionMock(),
}));

jest.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

async function callRootPage(): Promise<string> {
  const { default: RootPage } = await import("@/app/page");
  try {
    await RootPage();
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("__REDIRECT__:")) {
      return err.message.slice("__REDIRECT__:".length);
    }
    throw err;
  }
  throw new Error("RootPage returned without redirecting");
}

function session(role: UserRole): SessionPayload {
  return { id: 1, email: "u@example.com", role };
}

beforeEach(() => {
  jest.resetModules();
  getSessionMock.mockReset();
  redirectMock.mockClear();
});

describe("RootPage redirect by role", () => {
  it("sends anonymous visitors to /tienda", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    await expect(callRootPage()).resolves.toBe("/tienda");
  });

  it("sends Direccion to /dashboard", async () => {
    getSessionMock.mockResolvedValueOnce(session("Direccion"));
    await expect(callRootPage()).resolves.toBe("/dashboard");
  });

  it("sends Colaborador to /pedidos", async () => {
    getSessionMock.mockResolvedValueOnce(session("Colaborador"));
    await expect(callRootPage()).resolves.toBe("/pedidos");
  });

  it("sends Finanzas to /finanzas", async () => {
    getSessionMock.mockResolvedValueOnce(session("Finanzas"));
    await expect(callRootPage()).resolves.toBe("/finanzas");
  });

  it("normalizes the legacy 'Administrador' role to Direccion → /dashboard", async () => {
    // normalizeRole is the seam that maps the legacy alias. If RootPage stops
    // calling it, an Administrador session would fall through `as Role` and
    // landingPath would return /tienda (default branch), silently downgrading
    // an admin to the storefront — exactly the bug this PR fixes.
    getSessionMock.mockResolvedValueOnce(session("Administrador" as UserRole));
    await expect(callRootPage()).resolves.toBe("/dashboard");
  });

  it("calls getSession exactly once and does not fall through to /tienda when logged in", async () => {
    getSessionMock.mockResolvedValueOnce(session("Direccion"));
    await callRootPage();
    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
    expect(redirectMock).not.toHaveBeenCalledWith("/tienda");
  });
});

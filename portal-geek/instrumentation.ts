// Runs once when the Next.js server boots (Node.js runtime only — see the
// nodejs guard below). Fails the process loud if a production deploy ships
// without auth, so an accidental env-var omission can't quietly disable the
// edge gate.
//
// Findings remediated:
//   S10 — SKIP_AUTH=true would silently disable proxy.ts in any env.
//   S9  — Missing AUTH_SECRET would silently disable proxy.ts (and break
//          verifyToken everywhere else).

export async function register() {
  // Edge runtime imports this file too; runtime-gate so the assertion runs
  // exactly once at Node.js boot.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (process.env.NODE_ENV !== "production") return;

  const failures: string[] = [];

  if (process.env.SKIP_AUTH === "true") {
    failures.push(
      "SKIP_AUTH=true is set in a production build. This disables the edge auth gate (proxy.ts) and must never ship to production."
    );
  }

  if (!process.env.AUTH_SECRET) {
    failures.push(
      "AUTH_SECRET is unset in a production build. proxy.ts will fall back to NextResponse.next() and verifyToken will throw on every request."
    );
  } else if (process.env.AUTH_SECRET.length < 32) {
    failures.push(
      "AUTH_SECRET is shorter than 32 characters. lib/auth/tokens.ts rejects short secrets at sign time; this would fail every JWT operation."
    );
  }

  if (failures.length > 0) {
    const banner = [
      "",
      "============================================================",
      "  FATAL: portal-geek refusing to boot in production mode.",
      "------------------------------------------------------------",
      ...failures.map((f) => `  • ${f}`),
      "============================================================",
      "",
    ].join("\n");
    console.error(banner);
    // Abort the process so the deploy fails the health check instead of
    // serving traffic with auth disabled.
    process.exit(1);
  }
}

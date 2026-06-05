import { SignJWT, jwtVerify } from "jose";

import { normalizeRole } from "@/lib/auth/access";
import type { UserRole } from "@/types";

const JWT_ALG = "HS256";
// AU-01 sequence diagram: "JWT (exp. 8h)"
const JWT_EXPIRES = "8h";

export interface TokenClaims {
  id: number;
  email: string;
  rol: UserRole;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is not set or shorter than 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function generateToken(claims: TokenClaims): Promise<string> {
  return new SignJWT({ id: claims.id, email: claims.email, rol: claims.rol })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(getSecret());
}

// "Administrador" is a legacy alias of "Direccion". Normalizing here — the single
// chokepoint both getSession and proxy.ts pass through — means no downstream code
// (guards, layouts, policy module) ever observes the alias.
export async function verifyToken(token: string): Promise<TokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [JWT_ALG] });
    if (
      typeof payload.id === "number" &&
      typeof payload.email === "string" &&
      typeof payload.rol === "string"
    ) {
      return {
        id: payload.id,
        email: payload.email,
        rol: normalizeRole(payload.rol as UserRole),
      };
    }
    return null;
  } catch {
    return null;
  }
}

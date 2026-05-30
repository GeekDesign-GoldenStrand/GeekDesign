import { createHmac, timingSafeEqual } from "node:crypto";

// HMAC token bound to a storage key — proves the caller is the same one that
// just minted the key via POST. Used by the public disenios DELETE path so a
// leaked key alone doesn't grant delete rights (T5). The cart submit window is
// short; 30 min covers the realistic time from "uploaded" to "removed" without
// keeping the token valid forever.

const DELETE_TOKEN_TTL_MS = 30 * 60_000;

function getSecret(): Buffer {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET missing or too short for upload-token signing");
  }
  return Buffer.from(s, "utf8");
}

function mac(key: string, exp: number): string {
  return createHmac("sha256", getSecret()).update(`${key}.${exp}`).digest("base64url");
}

export function signUploadDeleteToken(key: string): {
  token: string;
  expiresInSeconds: number;
} {
  const exp = Date.now() + DELETE_TOKEN_TTL_MS;
  return {
    token: `${exp}.${mac(key, exp)}`,
    expiresInSeconds: Math.floor(DELETE_TOKEN_TTL_MS / 1000),
  };
}

export function verifyUploadDeleteToken(key: string, token: string | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expStr = token.slice(0, dot);
  const macStr = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const expected = mac(key, exp);
  const a = Buffer.from(expected, "base64url");
  const b = Buffer.from(macStr, "base64url");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

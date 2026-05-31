/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";

import { getClientIp } from "@/lib/utils/request-ip";

// Minimal NextRequest stand-in: only `headers.get` is exercised.
function makeReq(headers: Record<string, string>): NextRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest;
}

describe("getClientIp", () => {
  it("devuelve la única IP de X-Forwarded-For", () => {
    expect(getClientIp(makeReq({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("toma la IP de la DERECHA (la que añade el proxy de confianza), no la de la izquierda", () => {
    // The left value is client-supplied and spoofable; GCP appends the real
    // client IP on the right. Reading the rightmost defeats header spoofing.
    expect(getClientIp(makeReq({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 198.51.100.9" }))).toBe(
      "198.51.100.9"
    );
  });

  it("una IP spoofeada a la izquierda no cambia el resultado", () => {
    const spoofed = getClientIp(makeReq({ "x-forwarded-for": "66.66.66.66, 198.51.100.9" }));
    const honest = getClientIp(makeReq({ "x-forwarded-for": "198.51.100.9" }));
    expect(spoofed).toBe(honest);
  });

  it("recorta espacios alrededor de cada valor", () => {
    expect(getClientIp(makeReq({ "x-forwarded-for": "  1.1.1.1 ,  198.51.100.9  " }))).toBe(
      "198.51.100.9"
    );
  });

  it("ignora segmentos vacíos (comas extra / coma final)", () => {
    expect(getClientIp(makeReq({ "x-forwarded-for": "1.1.1.1, , 198.51.100.9, ," }))).toBe(
      "198.51.100.9"
    );
  });

  it("cae a X-Real-IP cuando no hay X-Forwarded-For", () => {
    expect(getClientIp(makeReq({ "x-real-ip": "192.0.2.50" }))).toBe("192.0.2.50");
  });

  it("cae a X-Real-IP cuando X-Forwarded-For está vacío o sólo tiene comas", () => {
    expect(getClientIp(makeReq({ "x-forwarded-for": " , ,", "x-real-ip": "192.0.2.50" }))).toBe(
      "192.0.2.50"
    );
  });

  it("usa el fallback por defecto ('unknown') cuando no hay encabezados", () => {
    expect(getClientIp(makeReq({}))).toBe("unknown");
  });

  it("respeta un fallback personalizado", () => {
    expect(getClientIp(makeReq({}), "anonymous")).toBe("anonymous");
  });
});

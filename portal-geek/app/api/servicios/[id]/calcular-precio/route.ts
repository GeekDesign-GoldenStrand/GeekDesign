import type { NextRequest } from "next/server";

import { CalcularPrecioSchema, ServicioIdParams } from "@/lib/schemas/servicios";
import { calcularPrecioServicio } from "@/lib/services/formula-pricing";
import { ok } from "@/lib/utils/api";
import { handleError, RateLimitError } from "@/lib/utils/errors";
import { peekRateLimit, recordAttempt } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request-ip";

// KIKW12 review #3: rate-limit per IP. This endpoint is called from a debounced
// fetch as the cliente types, so the limit needs to be generous for legitimate
// use but still cap abuse. 60 calls/minute is ~10x typical session traffic
// (debounce 400ms × normal typing ≈ 5–10 calls). Only successful calcs count.
const PRICING_RATE_LIMIT = { maxAttempts: 60, windowMs: 60_000 };

// Public storefront endpoint: cliente sees the price update as they edit
// material / variables / quantity. No auth — the servicio's active formula
// gates access, not a session.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req);
    const rateKey = `calcular-precio:${ip}`;
    const { allowed, retryAfterMs } = peekRateLimit(rateKey, PRICING_RATE_LIMIT);
    if (!allowed) {
      throw RateLimitError.fromMs(retryAfterMs);
    }
    const { id } = ServicioIdParams.parse(await ctx.params);
    const body = CalcularPrecioSchema.parse(await req.json());
    const precioUnitario = await calcularPrecioServicio({
      id_servicio: id,
      id_material: body.id_material,
      variables: body.variables,
    });
    recordAttempt(rateKey, PRICING_RATE_LIMIT);
    return ok({ precioUnitario });
  } catch (err) {
    return handleError(err);
  }
}

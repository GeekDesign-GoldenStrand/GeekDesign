import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/client";
import { issueAccessToken } from "@/lib/services/cotizacion-access";
import { ok } from "@/lib/utils/api";
import { handleError, RateLimitError } from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request-ip";

// KIKW12 review #1b/#2: re-issue a magic-link to the cliente on file when they
// look up a cotización from /tienda/cotizacion. We ALWAYS respond 200 with the
// same body to avoid leaking whether the folio exists or which email it belongs
// to — work happens silently when the lookup matches.
//
// Rate limit: per IP, 8 / 15min. Every attempt counts (this is the
// anti-enumeration control), but loose enough that a cliente who mistypes a few
// times — or who shares an office/school IP — isn't locked out of a real lookup.
const LINK_RATE_LIMIT = { maxAttempts: 8, windowMs: 15 * 60_000 };

const BodySchema = z.object({
  correo_electronico: z.string().email(),
});

type Params = { folio: string };

export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = checkRateLimit(`access-link:${ip}`, LINK_RATE_LIMIT);
    if (!allowed) {
      // Neutral 429: depends only on request rate, never on whether the folio /
      // email exist — so it stays anti-enumeration while telling the user to wait.
      throw RateLimitError.fromMs(retryAfterMs);
    }

    const { folio } = await ctx.params;
    const body = BodySchema.parse(await req.json());
    const correo = body.correo_electronico.trim().toLowerCase();

    const cot = await prisma.cotizaciones.findUnique({
      where: { folio },
      select: {
        id_cotizacion: true,
        folio: true,
        cliente: { select: { correo_electronico: true, nombre_cliente: true } },
      },
    });

    if (cot?.folio && cot.cliente.correo_electronico.trim().toLowerCase() === correo) {
      await issueAccessToken({
        id_cotizacion: cot.id_cotizacion,
        folio: cot.folio,
        correo_destino: cot.cliente.correo_electronico,
        nombre_cliente: cot.cliente.nombre_cliente,
      });
    }

    return ok({ mensaje: "Si los datos son correctos, te enviamos un correo con el enlace." });
  } catch (err) {
    return handleError(err);
  }
}

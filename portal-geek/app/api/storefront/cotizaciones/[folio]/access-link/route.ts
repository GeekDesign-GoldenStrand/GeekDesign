import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/client";
import { issueAccessToken } from "@/lib/services/cotizacion-access";
import { ok } from "@/lib/utils/api";
import { handleError, RateLimitError } from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";

// KIKW12 review #1b/#2: re-issue a magic-link to the cliente on file when they
// look up a cotización from /tienda/cotizacion. We ALWAYS respond 200 with the
// same body to avoid leaking whether the folio exists or which email it belongs
// to — work happens silently when the lookup matches.
//
// Rate limit: per IP, 3 / 15min. Tight enough to discourage enumeration; loose
// enough that a cliente who mistyped once can retry.
const LINK_RATE_LIMIT = { maxAttempts: 3, windowMs: 15 * 60_000 };

const BodySchema = z.object({
  correo_electronico: z.string().email(),
});

type Params = { folio: string };

export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const { allowed } = checkRateLimit(`access-link:${ip}`, LINK_RATE_LIMIT);
    if (!allowed) {
      throw new RateLimitError();
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

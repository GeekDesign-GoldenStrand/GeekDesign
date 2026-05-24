import crypto from "node:crypto";

import type { NextRequest } from "next/server";

import { prisma } from "@/lib/db/client";
import { ok } from "@/lib/utils/api";
import { handleError, UnauthorizedError } from "@/lib/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      throw new UnauthorizedError("Token no proporcionado");
    }

    const hash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await prisma.tokensRecuperacion.findUnique({
      where: { token_hash: hash },
    });

    if (!record || record.usado || record.expira_en < new Date()) {
      throw new UnauthorizedError("El enlace ha expirado o no es válido");
    }

    return ok({ valid: true });
  } catch (err) {
    return handleError(err);
  }
}

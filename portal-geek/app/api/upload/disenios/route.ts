import type { NextRequest } from "next/server";

import { prisma } from "@/lib/db/client";
import { PresignUploadSchema, UPLOAD_LIMITS } from "@/lib/schemas/upload";
import { DEFAULT_TTL_SECONDS, deleteObject, presignPut } from "@/lib/services/storage";
import { buildKey, extFromFilename, extFromMime, isValidKey } from "@/lib/storage/keys";
import { ok } from "@/lib/utils/api";
import {
  ConflictError,
  handleError,
  RateLimitError,
  ValidationError,
} from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";

// Public endpoint — no auth required. Rate-limited by IP to cap anonymous abuse.
// Only issues presigned PUTs for the "disenios" category.
// The browser still uploads directly to GCS; the server never touches the bytes.
const RATE_LIMIT = { maxAttempts: 10, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
    const { allowed } = checkRateLimit(`upload-disenios:${ip}`, RATE_LIMIT);
    if (!allowed) throw new RateLimitError();

    // Parse body but force category to "disenios" regardless of what the client sends.
    const raw = PresignUploadSchema.parse(await req.json());
    const body = { ...raw, category: "disenios" as const };

    const limits = UPLOAD_LIMITS.disenios;
    const contentType = body.contentType.split(";")[0].trim().toLowerCase();

    if (body.size > limits.maxBytes) {
      const mb = Math.round(limits.maxBytes / (1024 * 1024));
      throw new ValidationError(`El archivo excede el tamaño máximo (${mb} MB).`);
    }

    // disenios uses filename-based extension validation (.ai/.eps share a mime; .dxf has none)
    if (!body.filename) {
      throw new ValidationError("El nombre de archivo es requerido.");
    }
    const ext = extFromFilename(body.filename) ?? extFromMime(contentType);
    if (!ext || !limits.allowedExt!.includes(ext)) {
      throw new ValidationError(
        `Extensión no permitida. Formatos aceptados: ${limits.allowedExt!.join(", ")}.`
      );
    }

    const key = buildKey("disenios", ext);
    const url = await presignPut(key, contentType);

    return ok({ key, url, expiresIn: DEFAULT_TTL_SECONDS });
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/upload/disenios?key=... — removes an orphan design upload when
// the storefront user clicks "Quitar" before submitting the form. Public endpoint
// (storefront users are anonymous) but rate-limited by IP and scoped to the
// disenios/ prefix only. Refuses to delete keys already persisted in ArchivosDisenio.
export async function DELETE(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
    const { allowed } = checkRateLimit(`upload-disenios:${ip}`, RATE_LIMIT);
    if (!allowed) throw new RateLimitError();

    const key = new URL(req.url).searchParams.get("key");
    if (!key || !isValidKey(key, "disenios")) {
      throw new ValidationError("Clave de almacenamiento inválida.");
    }

    // Refuse to delete a key that was already saved to ArchivosDisenio — those
    // are managed through the entity's own lifecycle, not through this endpoint.
    const inUse = await prisma.archivosDisenio.findFirst({
      where: { url_archivo: key },
      select: { id_archivo: true },
    });
    if (inUse) {
      throw new ConflictError("Este archivo ya está en uso y no puede eliminarse desde aquí.");
    }

    await deleteObject(key);
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}

import type { NextRequest } from "next/server";

import { withAuth } from "@/lib/auth/guards";
import type { SessionPayload } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { PresignUploadSchema, UPLOAD_LIMITS } from "@/lib/schemas/upload";
import { DEFAULT_TTL_SECONDS, deleteObject, presignPut } from "@/lib/services/storage";
import { buildKey, extFromFilename, extFromMime, isValidKey } from "@/lib/storage/keys";
import { ok } from "@/lib/utils/api";
import {
  ConflictError,
  ForbiddenError,
  handleError,
  RateLimitError,
  ValidationError,
} from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";

// Caps the rate at which a single user can mint presigned PUT URLs. Presigns
// are cheap on our side but credentials in the wrong hands could fan-out
// uploads to the bucket; this bounds the blast radius.
const UPLOAD_RATE_LIMIT = { maxAttempts: 30, windowMs: 60_000 };

// POST /api/upload — issues a one-shot presigned PUT URL for direct browser upload.
// The client must PUT the file with the same Content-Type it declared here.
export const POST = withAuth(async (req: NextRequest, session: SessionPayload) => {
  try {
    const { allowed } = checkRateLimit(`upload:${session.id}`, UPLOAD_RATE_LIMIT);
    if (!allowed) throw new RateLimitError();

    const body = PresignUploadSchema.parse(await req.json());
    const limits = UPLOAD_LIMITS[body.category];

    // Server-only category — never hand out a presigned PUT for it.
    if (body.category === "cotizaciones") {
      throw new ForbiddenError("La categoría de cotizaciones se genera del lado del servidor.");
    }

    // Browsers may send "image/svg+xml; charset=utf-8" — strip parameters before matching.
    const contentType = body.contentType.split(";")[0].trim().toLowerCase();

    if (!limits.allowedMime.includes(contentType)) {
      throw new ValidationError("Tipo de archivo no permitido para esta categoría.");
    }
    if (body.size > limits.maxBytes) {
      const mb = Math.round(limits.maxBytes / (1024 * 1024));
      throw new ValidationError(`El archivo excede el tamaño máximo (${mb} MB).`);
    }

    // Categories with explicit extension allow-lists trust the filename, not
    // the mime — postscript covers both .ai and .eps, and .dxf has no mime.
    let ext: string | null = null;
    if (limits.allowedExt) {
      if (!body.filename) {
        throw new ValidationError("El nombre de archivo es requerido.");
      }
      const fromName = extFromFilename(body.filename);
      if (!fromName || !limits.allowedExt.includes(fromName)) {
        throw new ValidationError("Extensión de archivo no permitida.");
      }
      ext = fromName;
    } else {
      ext = extFromMime(contentType);
      if (!ext) throw new ValidationError("Tipo de archivo no soportado.");
    }

    const key = buildKey(body.category, ext);
    const url = await presignPut(key, contentType);

    return ok({ key, url, expiresIn: DEFAULT_TTL_SECONDS });
  } catch (err) {
    return handleError(err);
  }
});

// DELETE /api/upload?key=... — removes an orphan upload (e.g. the user
// clicked "Quitar" before saving the form). Refuses to delete any key that
// is already referenced by a persisted entity — those are removed via the
// entity's own update/delete flow.
export const DELETE = withAuth(async (req: NextRequest, session: SessionPayload) => {
  try {
    const { allowed } = checkRateLimit(`upload:${session.id}`, UPLOAD_RATE_LIMIT);
    if (!allowed) throw new RateLimitError();

    const key = new URL(req.url).searchParams.get("key");
    if (!key || !isValidKey(key)) {
      throw new ValidationError("Clave de almacenamiento inválida.");
    }

    if (key.startsWith("cotizaciones/")) {
      throw new ForbiddenError("La categoría de cotizaciones se administra del lado del servidor.");
    }

    // Block deletion of keys persisted to any entity. Extend this list when a
    // new entity starts storing storage keys.
    const inUse = await prisma.materiales.findFirst({
      where: { imagen_url: key },
      select: { id_material: true },
    });
    if (inUse) {
      throw new ConflictError("Esta imagen ya está en uso y no puede eliminarse desde aquí.");
    }

    await deleteObject(key);
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
});

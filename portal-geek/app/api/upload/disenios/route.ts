import type { NextRequest } from "next/server";

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
import { peekRateLimit, recordAttempt } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request-ip";
import { signUploadDeleteToken, verifyUploadDeleteToken } from "@/lib/utils/upload-token";

// Public endpoint — no auth required. Rate-limited by IP to cap anonymous abuse.
// Only issues presigned PUTs for the "disenios" category.
// The browser still uploads directly to GCS; the server never touches the bytes.
//
// ACCEPTED RISK — no content scanning:
// Validation here is purely metadata-based (client-supplied MIME + filename).
// A malicious client could upload arbitrary bytes under a valid extension (.dxf,
// .ai, .eps). There is no server-side byte inspection because the upload goes
// directly browser → GCS via presigned PUT, bypassing the Next.js process.
// Mitigation: the admin download route (/api/admin/archivos/[id]) generates a
// short-lived signed GET URL and the admin UI displays an unscanned-content
// warning on every design file link (see DesignFileLink component).
// Future hardening: wire in an async scan (GCS Object Finalize → Cloud Function
// → ClamAV/VirusTotal) and gate admin downloads on a scan_status field.
// Only successful presigns count: a customer building a cart with several
// custom designs (each a separate upload) shouldn't trip the limit, and
// rejected requests (422) are cheap and must not burn the budget.
const RATE_LIMIT = { maxAttempts: 20, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  try {
    const rateKey = `upload-disenios:${getClientIp(req, "anonymous")}`;
    const { allowed, retryAfterMs } = peekRateLimit(rateKey, RATE_LIMIT);
    if (!allowed) throw RateLimitError.fromMs(retryAfterMs);

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
    // T4: bind body.size into the signature so GCS rejects PUTs exceeding the
    // declared length. Without this an anonymous client could presign 10MB and
    // upload arbitrary bytes — wallet-DoS via storage fill.
    const url = await presignPut(key, contentType, body.size);
    // T5: HMAC the key into a short-lived delete token. The DELETE handler
    // below verifies it, so leaking just the key (e.g. via Sentry logs) no
    // longer grants delete rights — the attacker would also need the token.
    const { token: deleteToken, expiresInSeconds: deleteTokenExpiresIn } =
      signUploadDeleteToken(key);

    recordAttempt(rateKey, RATE_LIMIT);
    return ok({
      key,
      url,
      expiresIn: DEFAULT_TTL_SECONDS,
      deleteToken,
      deleteTokenExpiresIn,
    });
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
    const rateKey = `upload-disenios:${getClientIp(req, "anonymous")}`;
    const { allowed, retryAfterMs } = peekRateLimit(rateKey, RATE_LIMIT);
    if (!allowed) throw RateLimitError.fromMs(retryAfterMs);

    const searchParams = new URL(req.url).searchParams;
    const key = searchParams.get("key");
    const token = searchParams.get("token");
    if (!key || !isValidKey(key, "disenios")) {
      throw new ValidationError("Clave de almacenamiento inválida.");
    }

    // T5: require the HMAC delete-token issued by POST. Without it, anyone who
    // learns the key (e.g. from a leaked log) can wipe legitimate uploads.
    if (!verifyUploadDeleteToken(key, token)) {
      throw new ForbiddenError("Token de eliminación inválido o expirado.");
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
    recordAttempt(rateKey, RATE_LIMIT);
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}

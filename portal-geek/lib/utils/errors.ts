import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { ApiResponse } from "@/types";

// Base application error with an HTTP status code.
export class AppError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

// 404 helper for missing resources.
export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

// 401 helper for unauthenticated requests.
export class UnauthorizedError extends AppError {
  constructor(message = "No autenticado") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

// 403 helper for requests without permission.
export class ForbiddenError extends AppError {
  constructor(message = "Sin permisos para realizar esta acción") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

// 422 helper for validation failures.
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = "ValidationError";
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

// 500 helper for inconsistent database states.
export class DataInconsistencyError extends AppError {
  constructor(message: string) {
    super(message, 500);
    this.name = "DataInconsistencyError";
  }
}

// 409 helper for resources that cannot be modified because they are referenced.
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = "ConflictError";
  }
}

// 429 helper for clients that exceed a rate limit. Pass the retry delay (in
// seconds, or ms via the helper below) and the user-facing message and the
// `Retry-After` header are derived from it, so the client knows how long to wait
// instead of guessing.
export class RateLimitError extends AppError {
  /** Seconds until the caller may retry, surfaced as the `Retry-After` header. */
  readonly retryAfterSeconds?: number;

  constructor(retryAfterSeconds?: number) {
    const secs =
      typeof retryAfterSeconds === "number" && retryAfterSeconds > 0
        ? Math.ceil(retryAfterSeconds)
        : undefined;
    super(rateLimitMessage(secs), 429);
    this.name = "RateLimitError";
    this.retryAfterSeconds = secs;
  }

  /** Convenience for callers holding a millisecond delay (e.g. from peekRateLimit). */
  static fromMs(retryAfterMs?: number): RateLimitError {
    return new RateLimitError(typeof retryAfterMs === "number" ? retryAfterMs / 1000 : undefined);
  }
}

function rateLimitMessage(seconds?: number): string {
  if (!seconds) return "Demasiadas solicitudes. Intenta de nuevo en un momento.";
  if (seconds < 60) {
    return `Demasiadas solicitudes. Intenta de nuevo en ${seconds} segundos.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Demasiadas solicitudes. Intenta de nuevo en ${minutes} ${
    minutes === 1 ? "minuto" : "minutos"
  }.`;
}

// 422 helper for failures evaluating a service's pricing formula
// (parse error, unresolved identifier, unsupported origen, non-finite result, etc.).
export class EvaluatorError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = "EvaluatorError";
  }
}

// Zod is a schema validator; it checks input shape and returns detailed issues.
export function handleError(err: unknown): NextResponse<ApiResponse<never>> {
  if (err instanceof AppError) {
    const response = NextResponse.json({ data: null, error: err.message }, { status: err.status });
    if (err instanceof RateLimitError && err.retryAfterSeconds) {
      response.headers.set("Retry-After", String(err.retryAfterSeconds));
    }
    return response;
  }
  if (err instanceof ZodError) {
    const message = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return NextResponse.json({ data: null, error: message }, { status: 422 });
  }
  // P2020: numeric field overflow — bad input slipped past schema validation.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2020") {
    return NextResponse.json(
      { data: null, error: "Valor numérico fuera del rango permitido" },
      { status: 422 }
    );
  }
  if (err instanceof ConfigurationError) {
    if (process.env.NODE_ENV !== "test") {
      console.error("Configuration issue:", err.message);
    }
    return NextResponse.json(
      { data: null, error: "Internal configuration error" },
      { status: 500 }
    );
  }
  if (process.env.NODE_ENV !== "test") {
    console.error("[API Error]", err);
  }
  return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
}

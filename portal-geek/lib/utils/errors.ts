import { NextResponse } from "next/server";
import { ZodError } from "zod";
// Zod is a schema validation library that provides detailed error information when validation fails.

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

// 409 helper for resources that cannot be modified because they are referenced.
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = "ConflictError";
  }
}

// Zod is a schema validator; it checks input shape and returns detailed issues.
export function handleError(err: unknown): NextResponse<ApiResponse<never>> {
  if (err instanceof AppError) {
    return NextResponse.json({ data: null, error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const message = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return NextResponse.json({ data: null, error: message }, { status: 422 });
  }
  console.error("[API Error]", err);
  return NextResponse.json({ data: null, error: "Error interno del servidor" }, { status: 500 });
}

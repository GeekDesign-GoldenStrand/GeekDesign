/**
 * @jest-environment node
 */
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  handleError,
} from "@/lib/utils/errors";

describe("handleError", () => {
  it("devuelve 404 cuando recibe un NotFoundError", async () => {
    const response = handleError(new NotFoundError("Servicio 99 no encontrado"));
    const body = await response.json();
    expect(response.status).toBe(404);
    expect(body.error).toBe("Servicio 99 no encontrado");
    expect(body.data).toBeNull();
  });

  it("devuelve 401 cuando recibe un UnauthorizedError", async () => {
    const response = handleError(new UnauthorizedError());
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error).toBe("No autenticado");
    expect(body.data).toBeNull();
  });

  it("devuelve 403 cuando recibe un ForbiddenError", async () => {
    const response = handleError(new ForbiddenError());
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.error).toBe("Sin permisos para realizar esta acción");
    expect(body.data).toBeNull();
  });

  it("devuelve 422 cuando recibe un ValidationError", async () => {
    const response = handleError(new ValidationError("Campo inválido"));
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.error).toBe("Campo inválido");
    expect(body.data).toBeNull();
  });

  it("devuelve el status personalizado de un AppError genérico", async () => {
    const response = handleError(new AppError("Conflicto", 409));
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.error).toBe("Conflicto");
  });

  it("devuelve 422 con detalles cuando recibe un ZodError", async () => {
    const error = new ZodError([
      {
        code: "invalid_type",
        expected: "string",
        path: ["nombre_servicio"],
        message: "Required",
      } as never,
    ]);
    const response = handleError(error);
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.error).toContain("nombre_servicio");
    expect(body.data).toBeNull();
  });

  it("devuelve 500 para errores no manejados", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const response = handleError(new Error("algo explotó"));
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toBe("Error interno del servidor");
    expect(body.data).toBeNull();
    consoleSpy.mockRestore();
  });

  it("devuelve 500 cuando recibe un valor no-Error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const response = handleError("string inesperado");
    expect(response.status).toBe(500);
    consoleSpy.mockRestore();
  });

  // Regression: P2020 (numeric field overflow) was falling through to the
  // generic 500 handler because handleError didn't recognise Prisma errors.
  // It must now return 422 so the client gets a usable message instead of 500.
  it("devuelve 422 para Prisma P2020 (numeric field overflow)", async () => {
    const p2020 = new Prisma.PrismaClientKnownRequestError("Value out of range for the type", {
      code: "P2020",
      clientVersion: "7.0.0",
    });
    const response = handleError(p2020);
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.error).toBe("Valor numérico fuera del rango permitido");
    expect(body.data).toBeNull();
  });

  it("devuelve 500 para otros errores de Prisma (no P2020)", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const p2002 = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "7.0.0",
    });
    const response = handleError(p2002);
    expect(response.status).toBe(500);
    consoleSpy.mockRestore();
  });
});

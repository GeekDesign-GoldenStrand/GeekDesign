/**
 * @jest-environment node
 */
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
});

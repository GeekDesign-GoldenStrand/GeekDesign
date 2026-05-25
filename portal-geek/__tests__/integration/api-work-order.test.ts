/**
 * @jest-environment node
 */

import type { NextRouteHandler } from "../helpers/next-supertest";
import { createApp } from "../helpers/next-supertest";

const paramExtractor = (url: URL) => {
  const parts = url.pathname.split("/");
  return { id: parts[3] };
};

describe("GET /api/cotizaciones/[id]/work-order", () => {
  let workOrderGET: NextRouteHandler;

  beforeAll(async () => {
    const workOrderMod = await import("@/app/api/cotizaciones/[id]/work-order/route");
    workOrderGET = workOrderMod.GET as unknown as NextRouteHandler;
  });

  it("should return 404 and 'Esta vista está en construcción.' error message", async () => {
    const res = await createApp({ GET: workOrderGET }, paramExtractor)
      .get("/api/cotizaciones/6/work-order")
      .send();

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Esta vista está en construcción." });
  });
});

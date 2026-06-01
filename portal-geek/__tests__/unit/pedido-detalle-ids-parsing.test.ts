/**
 * @jest-environment node
 *
 * Unit tests for the detalleIds URL param parsing used in
 * app/(admin)/pedidos/[id]/page.tsx.
 */

import { parseDetalleIds } from "@/lib/utils/pedido-detalle-ids";

describe("parseDetalleIds — detalleIds URL param parsing", () => {
  it("returns null when param is undefined", () => {
    expect(parseDetalleIds(undefined)).toBeNull();
  });

  it("returns null when param is an empty string", () => {
    expect(parseDetalleIds("")).toBeNull();
  });

  it("parses a single id", () => {
    expect(parseDetalleIds("5")).toEqual([5]);
  });

  it("parses multiple comma-separated ids", () => {
    expect(parseDetalleIds("1,2,3")).toEqual([1, 2, 3]);
  });

  it("filters out NaN values from non-numeric segments", () => {
    expect(parseDetalleIds("1,abc,3")).toEqual([1, 3]);
  });

  it("filters out zero and negative values", () => {
    expect(parseDetalleIds("0,-1,2")).toEqual([2]);
  });

  it("returns null when all segments are invalid", () => {
    expect(parseDetalleIds("abc,0,-5")).toBeNull();
  });

  it("handles a single invalid segment gracefully", () => {
    expect(parseDetalleIds("xyz")).toBeNull();
  });

  it("trims nothing — spaces in the param produce NaN and are dropped", () => {
    // URL params won't normally contain spaces, but confirm the behaviour is
    // well-defined: Number(" 2") is 2 but Number("2 3") is NaN.
    expect(parseDetalleIds(" 2")).toEqual([2]);
    expect(parseDetalleIds("2 3")).toBeNull();
  });
});

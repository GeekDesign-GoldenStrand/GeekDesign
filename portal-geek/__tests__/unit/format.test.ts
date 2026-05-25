/**
 * @jest-environment node
 */
import { normalizePhone } from "@/lib/utils/format";

describe("normalizePhone", () => {
  it("strips the +52 1 country/mobile prefix from a pasted WhatsApp number", () => {
    // Regression: "+52 1 272 703 3148" used to become "521 272 7033".
    expect(normalizePhone("+52 1 272 703 3148")).toBe("2727033148");
  });

  it("strips a bare 52 country code without the mobile 1", () => {
    expect(normalizePhone("52 442 123 4567")).toBe("4421234567");
  });

  it("leaves a clean 10-digit national number untouched", () => {
    expect(normalizePhone("442 123 4567")).toBe("4421234567");
  });

  it("keeps a local number that legitimately starts with 1", () => {
    // 10 digits already — no country code to strip.
    expect(normalizePhone("1234567890")).toBe("1234567890");
  });

  it("removes all non-digit characters", () => {
    expect(normalizePhone("(442) 123-4567")).toBe("4421234567");
  });

  it("truncates anything beyond 10 digits once the prefix is removed", () => {
    expect(normalizePhone("5215512345678")).toBe("5512345678");
  });

  it("returns an empty string for input with no digits", () => {
    expect(normalizePhone("abc-def")).toBe("");
  });
});

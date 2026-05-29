/**
 * @jest-environment node
 */
import { containsEmoji, normalizePhone, stripEmoji } from "@/lib/utils/format";

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

// The maquinas UI strips emoji on every keystroke and the API layer rejects
// any payload that still contains one. These tests pin down the exact set of
// code points both sides agree on, so a regression in either surface (a
// looser strip on the client or a looser refine on the server) shows up here
// before it ships.
describe("stripEmoji / containsEmoji", () => {
  const SHOULD_REJECT: Array<[string, string]> = [
    ["basic pictograph", "hello 🚀"],
    ["skin-tone modifier", "wave 👋🏽"],
    // The classic regression case — a naive Extended_Pictographic strip leaves
    // the ZWJ behind, which is invisible but still pushes the trimmed string
    // over the length budget without showing why.
    ["ZWJ-composed family", "team 👨‍👩‍👧"],
    // Heart + emoji presentation selector. Same story: a pure pictograph
    // strip removes the heart but leaves U+FE0F orphaned.
    ["heart with variation selector", "love ❤️"],
    ["keycap sequence", "step 1️⃣"],
    // Regional indicator pair forms a flag — covered by Extended_Pictographic
    // already, asserted here as a guardrail in case the property class is
    // ever narrowed.
    ["flag (regional indicators)", "from 🇲🇽"],
    // Subdivision flag uses tag characters U+E0020–E007F. Phone keyboards
    // can produce this; we strip it explicitly because it isn't classified
    // as Extended_Pictographic.
    ["subdivision flag (tag chars)", "win 🏴󠁧󠁢󠁥󠁮󠁧󠁿"],
  ];

  it.each(SHOULD_REJECT)("containsEmoji flags %s", (_label, input) => {
    expect(containsEmoji(input)).toBe(true);
  });

  it.each(SHOULD_REJECT)("stripEmoji removes every emoji byte from %s", (_label, input) => {
    const cleaned = stripEmoji(input);
    expect(containsEmoji(cleaned)).toBe(false);
  });

  it("stripEmoji leaves the surrounding text intact", () => {
    expect(stripEmoji("CO2 🚀 100W")).toBe("CO2  100W");
  });

  it("strips invisible joiners even when the visible glyph is already gone", () => {
    // Simulates the "user types emoji, frontend strips it, but somehow an
    // orphaned joiner survives" failure mode — the regex must catch the
    // stragglers, not just the glyphs.
    expect(stripEmoji("a‍️b")).toBe("ab");
  });

  it("containsEmoji is false for plain ASCII and accented Spanish text", () => {
    expect(containsEmoji("Láser CO2 100W")).toBe(false);
    expect(containsEmoji("Cardenal")).toBe(false);
    expect(containsEmoji("")).toBe(false);
  });

  it("does not flag bare digits, # or *", () => {
    // These are Emoji_Component members but are legitimate text on their own —
    // only flagged when actually composed into a keycap (digit + U+FE0F + U+20E3).
    expect(containsEmoji("123")).toBe(false);
    expect(containsEmoji("issue #42")).toBe(false);
    expect(containsEmoji("a*b")).toBe(false);
  });

  it("the global / non-global regex pair shares deletion semantics", () => {
    // Smoke check that stripEmoji is idempotent: feeding its output back in
    // should be a no-op. Catches regressions where lookbehind / lastIndex
    // state would otherwise miss adjacent matches on a second pass.
    const cleaned = stripEmoji("👨‍👩‍👧 team 🚀");
    expect(stripEmoji(cleaned)).toBe(cleaned);
  });
});

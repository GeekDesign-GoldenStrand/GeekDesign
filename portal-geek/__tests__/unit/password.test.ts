/**
 * @jest-environment node
 */

// bcryptjs is pure JS, so we run the real hashing here (no mock) to exercise
// password.ts's actual hash/verify behaviour rather than a stubbed contract.
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password (AU-01 hashing)", () => {
  const plaintext = "Sup3rSecret!";

  it("AU01-P1: hashPassword devuelve un hash bcrypt distinto del texto plano", async () => {
    const hash = await hashPassword(plaintext);

    expect(hash).not.toBe(plaintext);
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt format, cost prefix
  });

  it("AU01-P2: hashea con coste 12 (SALT_ROUNDS)", async () => {
    const hash = await hashPassword(plaintext);

    expect(hash.split("$")[2]).toBe("12");
  });

  it("AU01-P3: el mismo texto produce hashes distintos (salt aleatorio)", async () => {
    const [a, b] = await Promise.all([hashPassword(plaintext), hashPassword(plaintext)]);

    expect(a).not.toBe(b);
  });

  it("AU01-P4: verifyPassword es true para la contraseña correcta", async () => {
    const hash = await hashPassword(plaintext);

    expect(await verifyPassword(plaintext, hash)).toBe(true);
  });

  it("AU01-P5: verifyPassword es false para una contraseña incorrecta", async () => {
    const hash = await hashPassword(plaintext);

    expect(await verifyPassword("contraseña-equivocada", hash)).toBe(false);
  });

  it("AU01-P6: verifyPassword es false ante un hash con el que no se firmó", async () => {
    const otherHash = await hashPassword("otra-cosa-distinta");

    expect(await verifyPassword(plaintext, otherHash)).toBe(false);
  });
});

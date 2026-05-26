// Dev-only helper: mints a TokensAccesoCotizacion row and prints the magic-link URL.
// Usage: node scripts/mint-access-url.mjs <id_cotizacion>
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const id_cotizacion = Number(process.argv[2]);
if (!id_cotizacion) {
  console.error("Usage: node scripts/mint-access-url.mjs <id_cotizacion>");
  process.exit(1);
}

const raw = crypto.randomBytes(32).toString("hex");
const token_hash = crypto.createHash("sha256").update(raw).digest("hex");
const expira_en = new Date(Date.now() + 30 * 60 * 1000);

await prisma.tokensAccesoCotizacion.create({
  data: { id_cotizacion, token_hash, expira_en },
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
console.log(`${appUrl}/api/storefront/cotizaciones/access?token=${raw}`);

await prisma.$disconnect();
await pool.end();

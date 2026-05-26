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

const cs = await prisma.cotizaciones.findMany({
  where: { id_cotizacion: { in: [90, 91] } },
  include: { estatus: true },
});
console.log(
  cs.map((c) => ({ id: c.id_cotizacion, folio: c.folio, estatus: c.estatus.descripcion }))
);

await prisma.$disconnect();
await pool.end();

// Dev-only helper: flips a cotización to a given estatus.
// Usage: node scripts/flip-status.mjs <id_cotizacion> [estatus=Pendiente]
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const id = Number(process.argv[2]);
const estatus = process.argv[3] ?? "Pendiente";
if (!id) {
  console.error("Usage: node scripts/flip-status.mjs <id_cotizacion> [estatus=Pendiente]");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const target = await prisma.estatusCotizacion.findUniqueOrThrow({
  where: { descripcion: estatus },
});
await prisma.cotizaciones.update({
  where: { id_cotizacion: id },
  data: { id_estatus_cotizacion: target.id_estatus },
});
console.log(`Flipped ${id} to ${estatus}`);

await prisma.$disconnect();
await pool.end();

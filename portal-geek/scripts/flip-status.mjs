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

const pendiente = await prisma.estatusCotizacion.findUnique({
  where: { descripcion: "Pendiente" },
});
await prisma.cotizaciones.update({
  where: { id_cotizacion: 90 },
  data: { id_estatus_cotizacion: pendiente.id_estatus },
});
console.log("Flipped 90 to Pendiente");

await prisma.$disconnect();
await pool.end();

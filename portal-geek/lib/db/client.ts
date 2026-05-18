// Prisma client singleton — avoids multiple instances in dev (hot reload)
// Prisma 7 requires a driver adapter; we use @prisma/adapter-pg for PostgreSQL.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

function createPrismaClient() {
  // No TLS config here. Local dev uses plain Postgres; App Engine reaches
  // Cloud SQL over the `/cloudsql/INSTANCE` Unix socket; developers needing
  // remote Cloud SQL access run the Cloud SQL Auth Proxy locally (which
  // terminates TLS itself and exposes a plaintext socket on 127.0.0.1).
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

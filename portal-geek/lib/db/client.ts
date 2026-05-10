// Prisma client singleton — avoids multiple instances in dev (hot reload)
// Prisma 7 requires a driver adapter; we use @prisma/adapter-pg for PostgreSQL.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

function createPrismaClient() {
  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: ca
      ? { ca, rejectUnauthorized: true, checkServerIdentity: () => undefined }
      : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

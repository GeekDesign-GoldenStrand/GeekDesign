import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "prisma/config";

// Prisma CLI only auto-loads `.env`. Next.js uses `.env.local` for local
// secrets, so we load it manually here to keep a single source of truth.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),

  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },

  // Seed command (replaces the deprecated package.json#prisma.seed)
  migrations: {
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
});

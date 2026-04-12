import path from "node:path";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),

  // Database URL used by Prisma Migrate and Studio
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },

  // Seed command (replaces the deprecated package.json#prisma.seed)
  migrations: {
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
});

import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local manually since Prisma doesn't pick it up automatically
const envLocal = path.resolve(".env.local");
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, "utf-8").split("\n")) {
    const match = line.match(/^([^#=\s]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (match) process.env[match[1]] ??= match[2];
  }
}

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

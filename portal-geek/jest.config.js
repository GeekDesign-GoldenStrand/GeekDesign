// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customConfig = {
  coverageProvider: "v8",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "__tests__/helpers/"],
  // Coverage scope: business logic only. Pages, layouts, components, and
  // presentational hooks are intentionally excluded — Jest is not the right
  // tool for them and including them dilutes the metric without catching the
  // regressions that actually cost us. API route handlers under app/api/**
  // stay in scope because they're business logic with no JSX.
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "app/api/**/*.{ts,tsx}",
    "!lib/hooks/**",
    // Wrong-tool-for-the-job exclusions: singletons / pure data / RSC-only.
    // Jest can't meaningfully cover these; including them mis-states the metric.
    "!lib/db/client.ts", // Prisma singleton — mocked in every test
    "!lib/storage/client.ts", // S3Client singleton — mocked in every test
    "!lib/email/mailer.ts", // Resend wrapper — mocked
    "!lib/constants/**", // pure data tables
    "!lib/auth/page-guard.ts", // Server Component guard, not runnable under jsdom
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  // Floor for business-logic coverage. Set ~7pp below the current measurement
  // so a small in-flight feature can land without a flake, but a 500-line
  // service with zero tests fails CI loudly. Raise these as coverage climbs.
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 75,
      functions: 60,
      lines: 60,
    },
  },
  transformIgnorePatterns: ["/node_modules/(?!jose)"],
};

module.exports = createJestConfig(customConfig);
